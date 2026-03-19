import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import {
  getDataDir,
  isGraphDirty,
  clearGraphDirty,
  listEntities,
} from "./fs-data"
import {
  JobFrontmatterSchema,
  ApplicationFrontmatterSchema,
  ContactFrontmatterSchema,
  CompanyFrontmatterSchema,
  ThreadFrontmatterSchema,
} from "./types"
import type { GraphNode, GraphEdge, GraphEdgeRel, GraphIndex } from "./types"

const GRAPH_VERSION = 1
const GRAPH_FILENAME = ".graph.json"

let cachedIndex: GraphIndex | null = null

// For testing only: reset the cached index
export function _resetCachedIndex(): void {
  cachedIndex = null
}

function graphFilePath(): string {
  return path.join(getDataDir(), GRAPH_FILENAME)
}

// --- Internal: Read thread directories ---

async function readThreads(): Promise<{ slug: string; data: Record<string, unknown> }[]> {
  const messagesDir = path.join(getDataDir(), "messages")
  try {
    const entries = await fs.readdir(messagesDir, { withFileTypes: true })
    const results: { slug: string; data: Record<string, unknown> }[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      try {
        const raw = await fs.readFile(path.join(messagesDir, entry.name, "thread.md"), "utf-8")
        const { data } = matter(raw)
        results.push({ slug: entry.name, data })
      } catch {
        // skip threads without thread.md
      }
    }
    return results
  } catch {
    return []
  }
}

// --- Rebuild ---

export async function rebuildGraphIndex(): Promise<GraphIndex> {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const warnings: string[] = []
  const slugSet = new Set<string>()

  // Read all entities in parallel (listEntities already validates frontmatter)
  const [jobResult, appResult, contactResult, companyResult, threadEntries] =
    await Promise.all([
      listEntities("jobs", JobFrontmatterSchema),
      listEntities("applications", ApplicationFrontmatterSchema),
      listEntities("contacts", ContactFrontmatterSchema),
      listEntities("companies", CompanyFrontmatterSchema),
      readThreads(),
    ])

  // Register nodes
  for (const { slug } of jobResult.items) {
    nodes.push({ slug, type: "job" })
    slugSet.add(slug)
  }
  for (const { slug } of appResult.items) {
    nodes.push({ slug, type: "application" })
    slugSet.add(slug)
  }
  for (const { slug } of contactResult.items) {
    nodes.push({ slug, type: "contact" })
    slugSet.add(slug)
  }
  for (const { slug } of companyResult.items) {
    nodes.push({ slug, type: "company" })
    slugSet.add(slug)
  }
  for (const { slug } of threadEntries) {
    nodes.push({ slug, type: "thread" })
    slugSet.add(slug)
  }

  // Add profile node (always exists conceptually)
  nodes.push({ slug: "profile", type: "profile" })
  slugSet.add("profile")

  // Build edges from validated frontmatter
  const pendingEdges: GraphEdge[] = []

  for (const { slug, frontmatter } of jobResult.items) {
    if (frontmatter.company_ref) {
      pendingEdges.push({ from: slug, to: frontmatter.company_ref, rel: "job_at_company" })
    }
    if (frontmatter.contact_refs) {
      for (const ref of frontmatter.contact_refs) {
        pendingEdges.push({ from: slug, to: ref, rel: "job_contact" })
      }
    }
  }

  for (const { slug, frontmatter } of appResult.items) {
    if (frontmatter.job) {
      pendingEdges.push({ from: slug, to: frontmatter.job, rel: "application_for_job" })
    }
  }

  for (const { slug, frontmatter } of contactResult.items) {
    if (frontmatter.company_ref) {
      pendingEdges.push({ from: slug, to: frontmatter.company_ref, rel: "contact_at_company" })
    }
    if (frontmatter.job_refs) {
      for (const ref of frontmatter.job_refs) {
        pendingEdges.push({ from: slug, to: ref, rel: "contact_for_job" })
      }
    }
  }

  for (const { slug, data } of threadEntries) {
    const parsed = ThreadFrontmatterSchema.safeParse(data)
    if (!parsed.success) continue
    if (parsed.data.job_ref) {
      pendingEdges.push({ from: slug, to: parsed.data.job_ref, rel: "thread_about_job" })
    }
  }

  // Prune dangling edges and detect cycles
  const visited = new Set<string>()
  for (const edge of pendingEdges) {
    if (!slugSet.has(edge.to)) {
      warnings.push(`Dangling edge: ${edge.from} -[${edge.rel}]-> ${edge.to} (target not found)`)
      continue
    }
    // Detect self-referential edges
    if (edge.from === edge.to) {
      warnings.push(`Self-referential edge skipped: ${edge.from} -[${edge.rel}]-> ${edge.to}`)
      continue
    }
    const edgeKey = `${edge.from}:${edge.rel}:${edge.to}`
    if (visited.has(edgeKey)) continue
    visited.add(edgeKey)
    edges.push(edge)
  }

  if (warnings.length > 0) {
    console.warn(`[graph] ${warnings.length} warning(s) during rebuild:`, warnings)
  }

  const index: GraphIndex = {
    version: GRAPH_VERSION,
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  }

  // Atomic write: write to .tmp then rename
  const target = graphFilePath()
  const tmp = target + ".tmp"
  try {
    await fs.writeFile(tmp, JSON.stringify(index, null, 2), "utf-8")
    await fs.rename(tmp, target)
  } catch (err) {
    console.error("[graph] Failed to write graph index to disk:", err)
    // Keep in-memory index even if disk write fails
  }

  cachedIndex = index
  clearGraphDirty()
  return index
}

// --- Read / Load ---

async function loadFromDisk(): Promise<GraphIndex | null> {
  try {
    const raw = await fs.readFile(graphFilePath(), "utf-8")
    const parsed = JSON.parse(raw)
    if (parsed && parsed.version === GRAPH_VERSION && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed as GraphIndex
    }
    // Version mismatch or corrupt structure — delete and rebuild
    await fs.unlink(graphFilePath()).catch(() => {})
    return null
  } catch {
    return null
  }
}

// --- Public API ---

export async function getGraphIndex(): Promise<GraphIndex> {
  if (cachedIndex && !isGraphDirty()) {
    return cachedIndex
  }

  // Try loading from disk if no cached index
  if (!cachedIndex) {
    const fromDisk = await loadFromDisk()
    if (fromDisk && !isGraphDirty()) {
      cachedIndex = fromDisk
      return fromDisk
    }
  }

  // Rebuild needed
  return rebuildGraphIndex()
}

export async function getRelationships(slug: string): Promise<GraphEdge[]> {
  const index = await getGraphIndex()
  return index.edges.filter((e) => e.from === slug || e.to === slug)
}

export async function getNeighbors(slug: string): Promise<GraphNode[]> {
  const index = await getGraphIndex()
  const neighborSlugs = new Set<string>()
  for (const edge of index.edges) {
    if (edge.from === slug) neighborSlugs.add(edge.to)
    if (edge.to === slug) neighborSlugs.add(edge.from)
  }
  return index.nodes.filter((n) => neighborSlugs.has(n.slug))
}

export async function getNodesByType(type: GraphNode["type"]): Promise<GraphNode[]> {
  const index = await getGraphIndex()
  return index.nodes.filter((n) => n.type === type)
}
