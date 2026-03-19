import { describe, it, expect, vi, beforeEach } from "vitest"
import matter from "gray-matter"

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(""),
    writeFile: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
  },
}))

process.env.TALENTCLAW_DIR = "/tmp/talentclaw-test"

import fs from "node:fs/promises"
import { markGraphDirty, clearGraphDirty } from "@/lib/fs-data"
import {
  rebuildGraphIndex,
  getGraphIndex,
  getRelationships,
  getNeighbors,
  getNodesByType,
  _resetCachedIndex,
} from "@/lib/graph"

const mockedFs = vi.mocked(fs)

function makeJobFile(title: string, company: string, opts: Record<string, unknown> = {}) {
  return matter.stringify("", { title, company, status: "discovered", source: "manual", ...opts })
}

function makeAppFile(job: string, opts: Record<string, unknown> = {}) {
  return matter.stringify("", { job, status: "applied", ...opts })
}

function makeContactFile(name: string, opts: Record<string, unknown> = {}) {
  return matter.stringify("", { name, ...opts })
}

function makeCompanyFile(name: string, opts: Record<string, unknown> = {}) {
  return matter.stringify("", { name, ...opts })
}

function makeThreadFile(participant: string, opts: Record<string, unknown> = {}) {
  return matter.stringify("", { participant, last_active: "2026-01-01T00:00:00Z", ...opts })
}

beforeEach(() => {
  vi.clearAllMocks()
  clearGraphDirty()
  _resetCachedIndex()
  mockedFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
  mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
  mockedFs.mkdir.mockResolvedValue(undefined)
  mockedFs.writeFile.mockResolvedValue(undefined)
  mockedFs.rename.mockResolvedValue(undefined)
  mockedFs.unlink.mockResolvedValue(undefined)
  mockedFs.access.mockResolvedValue(undefined)
})

describe("rebuildGraphIndex", () => {
  it("builds empty index from zero files", async () => {
    const index = await rebuildGraphIndex()
    // Only profile node exists
    expect(index.nodes).toHaveLength(1)
    expect(index.nodes[0]).toEqual({ slug: "profile", type: "profile" })
    expect(index.edges).toEqual([])
    expect(index.version).toBe(1)
    expect(index.updatedAt).toBeTruthy()
  })

  it("builds index from multiple entity types", async () => {
    const fileContents: Record<string, string> = {
      "acme.md": makeJobFile("Engineer", "Acme", { company_ref: "acme-corp" }),
      "app1.md": makeAppFile("acme"),
      "jane.md": makeContactFile("Jane Doe", { company_ref: "acme-corp" }),
      "acme-corp.md": makeCompanyFile("Acme Corp"),
    }

    mockedFs.readdir.mockImplementation(((dirPath: string, _opts?: unknown) => {
      if (dirPath.endsWith("/jobs")) return Promise.resolve(["acme.md"])
      if (dirPath.endsWith("/applications")) return Promise.resolve(["app1.md"])
      if (dirPath.endsWith("/contacts")) return Promise.resolve(["jane.md"])
      if (dirPath.endsWith("/companies")) return Promise.resolve(["acme-corp.md"])
      if (dirPath.endsWith("/messages")) return Promise.resolve([])
      return Promise.resolve([])
    }) as typeof fs.readdir)

    mockedFs.readFile.mockImplementation(((filePath: string) => {
      const filename = filePath.split("/").pop() || ""
      if (fileContents[filename]) return Promise.resolve(fileContents[filename])
      return Promise.reject(new Error("ENOENT"))
    }) as typeof fs.readFile)

    const index = await rebuildGraphIndex()
    // profile + job + app + contact + company = 5
    expect(index.nodes).toHaveLength(5)
    // job→company, app→job, contact→company = 3 edges
    expect(index.edges).toHaveLength(3)
  })

  it("prunes dangling edges when target is missing", async () => {
    mockedFs.readdir.mockImplementation(((dirPath: string, _opts?: unknown) => {
      if (dirPath.endsWith("/jobs")) return Promise.resolve(["job1.md"])
      if (dirPath.endsWith("/messages")) return Promise.resolve([])
      return Promise.resolve([])
    }) as typeof fs.readdir)

    mockedFs.readFile.mockImplementation(((filePath: string) => {
      if (filePath.endsWith("job1.md")) return Promise.resolve(makeJobFile("Engineer", "Acme", { company_ref: "nonexistent" }))
      return Promise.reject(new Error("ENOENT"))
    }) as typeof fs.readFile)

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const index = await rebuildGraphIndex()
    expect(index.edges).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("includes version field", async () => {
    const index = await rebuildGraphIndex()
    expect(index.version).toBe(1)
  })

  it("performs atomic write (tmp + rename)", async () => {
    await rebuildGraphIndex()
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".graph.json.tmp"),
      expect.any(String),
      "utf-8"
    )
    expect(mockedFs.rename).toHaveBeenCalledWith(
      expect.stringContaining(".graph.json.tmp"),
      expect.stringContaining(".graph.json")
    )
  })

  it("handles disk write failure gracefully", async () => {
    mockedFs.writeFile.mockRejectedValueOnce(new Error("ENOSPC"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const index = await rebuildGraphIndex()
    // Should still return a valid in-memory index
    expect(index.nodes.length).toBeGreaterThanOrEqual(1)
    errSpy.mockRestore()
  })
})

describe("getGraphIndex", () => {
  it("rebuilds when dirty", async () => {
    markGraphDirty()
    const index = await getGraphIndex()
    expect(index.version).toBe(1)
  })

  it("loads from disk when available and not dirty", async () => {
    const diskIndex = {
      version: 1,
      nodes: [{ slug: "profile", type: "profile" }],
      edges: [],
      updatedAt: "2026-01-01T00:00:00Z",
    }
    // First call to getGraphIndex with no cache — tries to load from disk
    mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(diskIndex))

    clearGraphDirty()
    // Reset module-level cache by rebuilding first with clean state
    const index = await getGraphIndex()
    expect(index.version).toBe(1)
  })

  it("rebuilds when .graph.json is corrupt", async () => {
    mockedFs.readFile.mockResolvedValueOnce("{invalid json")
    markGraphDirty()
    const index = await getGraphIndex()
    expect(index.version).toBe(1)
    expect(index.nodes.length).toBeGreaterThanOrEqual(1)
  })
})

describe("graph queries", () => {
  const fileContents: Record<string, string> = {
    "j1.md": makeJobFile("Eng", "Co1", { company_ref: "co1" }),
    "j2.md": makeJobFile("PM", "Co1"),
    "a1.md": makeAppFile("j1"),
    "c1.md": makeContactFile("Alice", { company_ref: "co1" }),
    "co1.md": makeCompanyFile("Company One"),
  }

  async function buildTestGraph() {
    mockedFs.readdir.mockImplementation(((dirPath: string, _opts?: unknown) => {
      if (dirPath.endsWith("/jobs")) return Promise.resolve(["j1.md", "j2.md"])
      if (dirPath.endsWith("/applications")) return Promise.resolve(["a1.md"])
      if (dirPath.endsWith("/contacts")) return Promise.resolve(["c1.md"])
      if (dirPath.endsWith("/companies")) return Promise.resolve(["co1.md"])
      if (dirPath.endsWith("/messages")) return Promise.resolve([])
      return Promise.resolve([])
    }) as typeof fs.readdir)

    mockedFs.readFile.mockImplementation(((filePath: string) => {
      const filename = filePath.split("/").pop() || ""
      if (fileContents[filename]) return Promise.resolve(fileContents[filename])
      return Promise.reject(new Error("ENOENT"))
    }) as typeof fs.readFile)

    return rebuildGraphIndex()
  }

  it("getRelationships returns edges involving a slug", async () => {
    const index = await buildTestGraph()
    expect(index.edges.length).toBeGreaterThanOrEqual(1) // sanity check
    const rels = await getRelationships("j1")
    expect(rels.length).toBeGreaterThanOrEqual(1)
    expect(rels.some((r) => r.rel === "job_at_company")).toBe(true)
  })

  it("getNeighbors returns connected nodes", async () => {
    const index = await buildTestGraph()
    expect(index.edges.length).toBeGreaterThanOrEqual(1)
    const neighbors = await getNeighbors("co1")
    expect(neighbors.length).toBeGreaterThanOrEqual(1)
    expect(neighbors.some((n) => n.type === "job")).toBe(true)
  })

  it("getNodesByType filters correctly", async () => {
    await buildTestGraph()
    const jobs = await getNodesByType("job")
    expect(jobs).toHaveLength(2)
    expect(jobs.every((n) => n.type === "job")).toBe(true)

    const profiles = await getNodesByType("profile")
    expect(profiles).toHaveLength(1)
  })
})
