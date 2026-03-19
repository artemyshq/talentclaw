import { describe, it, expect, vi, beforeEach } from "vitest"
import matter from "gray-matter"

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(""),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
  },
}))

process.env.TALENTCLAW_DIR = "/tmp/talentclaw-test"

import fs from "node:fs/promises"
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  listJobs,
  listApplications,
  isGraphDirty,
  clearGraphDirty,
} from "@/lib/fs-data"

const mockedFs = vi.mocked(fs)

beforeEach(() => {
  vi.clearAllMocks()
  clearGraphDirty()
})

describe("listJobs (via generic helper)", () => {
  it("returns empty array for empty directory", async () => {
    mockedFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    const jobs = await listJobs()
    expect(jobs).toEqual([])
  })

  it("parses valid job files", async () => {
    const content = matter.stringify("Notes", { title: "SRE", company: "Acme", status: "saved", source: "manual" })
    mockedFs.readdir.mockResolvedValue(["sre.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile.mockResolvedValue(content)
    const jobs = await listJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].frontmatter.title).toBe("SRE")
  })

  it("skips invalid files without crashing", async () => {
    mockedFs.readdir.mockResolvedValue(["bad.md", "good.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile
      .mockResolvedValueOnce(matter.stringify("", { invalid: true })) // missing required fields
      .mockResolvedValueOnce(matter.stringify("", { title: "Good", company: "Co", source: "manual" }))
    const jobs = await listJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].slug).toBe("good")
  })
})

describe("listApplications (via generic helper)", () => {
  it("returns parsed applications", async () => {
    const content = matter.stringify("", { job: "acme-sre", status: "applied" })
    mockedFs.readdir.mockResolvedValue(["app1.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile.mockResolvedValue(content)
    const apps = await listApplications()
    expect(apps).toHaveLength(1)
    expect(apps[0].frontmatter.job).toBe("acme-sre")
  })
})

describe("Contacts CRUD", () => {
  it("listContacts returns empty for empty dir", async () => {
    mockedFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    expect(await listContacts()).toEqual([])
  })

  it("listContacts parses valid files", async () => {
    const content = matter.stringify("Bio", { name: "Jane Doe", email: "jane@example.com" })
    mockedFs.readdir.mockResolvedValue(["jane.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile.mockResolvedValue(content)
    const contacts = await listContacts()
    expect(contacts).toHaveLength(1)
    expect(contacts[0].frontmatter.name).toBe("Jane Doe")
    expect(contacts[0].content).toBe("Bio")
  })

  it("getContact returns parsed contact", async () => {
    const content = matter.stringify("Notes", { name: "Alice" })
    mockedFs.readFile.mockResolvedValue(content)
    const contact = await getContact("alice")
    expect(contact).not.toBeNull()
    expect(contact!.frontmatter.name).toBe("Alice")
  })

  it("getContact returns null for missing file", async () => {
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
    const contact = await getContact("missing")
    expect(contact).toBeNull()
  })

  it("createContact writes file and marks graph dirty", async () => {
    clearGraphDirty()
    await createContact("bob", { name: "Bob" })
    expect(mockedFs.writeFile).toHaveBeenCalled()
    expect(isGraphDirty()).toBe(true)
  })

  it("updateContact merges data and marks graph dirty", async () => {
    const existing = matter.stringify("Notes", { name: "Bob", email: "old@test.com" })
    mockedFs.readFile.mockResolvedValue(existing)
    clearGraphDirty()
    await updateContact("bob", { email: "new@test.com" })
    expect(mockedFs.writeFile).toHaveBeenCalled()
    expect(isGraphDirty()).toBe(true)
  })

  it("deleteContact removes file and marks graph dirty", async () => {
    clearGraphDirty()
    await deleteContact("bob")
    expect(mockedFs.unlink).toHaveBeenCalled()
    expect(isGraphDirty()).toBe(true)
  })

  it("deleteContact throws for missing file", async () => {
    const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    mockedFs.unlink.mockRejectedValueOnce(err)
    await expect(deleteContact("missing")).rejects.toThrow("Contact not found")
  })
})

describe("Companies CRUD", () => {
  it("listCompanies returns empty for empty dir", async () => {
    mockedFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    expect(await listCompanies()).toEqual([])
  })

  it("listCompanies parses valid files", async () => {
    const content = matter.stringify("About", { name: "TechCo", industry: "SaaS" })
    mockedFs.readdir.mockResolvedValue(["techco.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile.mockResolvedValue(content)
    const companies = await listCompanies()
    expect(companies).toHaveLength(1)
    expect(companies[0].frontmatter.name).toBe("TechCo")
  })

  it("getCompany returns parsed company", async () => {
    const content = matter.stringify("Research notes", { name: "StartupX" })
    mockedFs.readFile.mockResolvedValue(content)
    const company = await getCompany("startupx")
    expect(company).not.toBeNull()
    expect(company!.frontmatter.name).toBe("StartupX")
  })

  it("getCompany returns null for missing file", async () => {
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
    expect(await getCompany("missing")).toBeNull()
  })

  it("createCompany writes file and marks graph dirty", async () => {
    clearGraphDirty()
    await createCompany("co", { name: "Co Inc" })
    expect(mockedFs.writeFile).toHaveBeenCalled()
    expect(isGraphDirty()).toBe(true)
  })

  it("updateCompany merges and marks graph dirty", async () => {
    mockedFs.readFile.mockResolvedValue(matter.stringify("", { name: "Old", industry: "Old" }))
    clearGraphDirty()
    await updateCompany("co", { industry: "New" })
    expect(mockedFs.writeFile).toHaveBeenCalled()
    expect(isGraphDirty()).toBe(true)
  })

  it("deleteCompany removes and marks dirty", async () => {
    clearGraphDirty()
    await deleteCompany("co")
    expect(mockedFs.unlink).toHaveBeenCalled()
    expect(isGraphDirty()).toBe(true)
  })

  it("deleteCompany throws for missing file", async () => {
    const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    mockedFs.unlink.mockRejectedValueOnce(err)
    await expect(deleteCompany("nonexistent")).rejects.toThrow("Company not found")
  })
})

describe("mutations mark graph dirty", () => {
  it("createContact marks dirty", async () => {
    clearGraphDirty()
    expect(isGraphDirty()).toBe(false)
    await createContact("test", { name: "Test" })
    expect(isGraphDirty()).toBe(true)
  })

  it("createCompany marks dirty", async () => {
    clearGraphDirty()
    await createCompany("test", { name: "Test" })
    expect(isGraphDirty()).toBe(true)
  })
})
