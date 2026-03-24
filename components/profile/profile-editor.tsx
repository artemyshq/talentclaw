"use client"

import { useState, useTransition } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  User,
  Briefcase,
  GraduationCap,
  Target,
  FileText,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { updateProfile } from "@/app/actions/profile"
import type { ProfileFile, Experience, Education, Goal } from "@/lib/types"

interface ProfileEditorProps {
  profile: ProfileFile
  resumeContent: string | null
}

type Tab = "basic" | "experience" | "education" | "goals" | "resume"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "basic", label: "Basic Info", icon: <User className="w-4 h-4" /> },
  { id: "experience", label: "Experience", icon: <Briefcase className="w-4 h-4" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "goals", label: "Goals", icon: <Target className="w-4 h-4" /> },
  { id: "resume", label: "Resume", icon: <FileText className="w-4 h-4" /> },
]

const REMOTE_OPTIONS = [
  { value: "", label: "Select preference..." },
  { value: "remote_only", label: "Remote only" },
  { value: "remote_ok", label: "Remote OK" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
  { value: "flexible", label: "Flexible" },
]

const AVAILABILITY_OPTIONS = [
  { value: "", label: "Select availability..." },
  { value: "active", label: "Actively looking" },
  { value: "passive", label: "Open to opportunities" },
  { value: "not_looking", label: "Not looking" },
]

// --- Feedback banner ---
function FeedbackBanner({ status, message }: { status: "success" | "error"; message: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mb-6 ${
        status === "success"
          ? "bg-accent/8 text-accent border border-accent/20"
          : "bg-danger/8 text-danger border border-danger/20"
      }`}
    >
      {status === "success" ? (
        <Check className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      {message}
    </div>
  )
}

// --- Field helpers ---
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-text-primary mb-1.5">{children}</label>
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// --- Basic Info tab ---
function BasicInfoTab({
  profile,
  onSave,
  isPending,
}: {
  profile: ProfileFile
  onSave: (updates: Record<string, unknown>) => void
  isPending: boolean
}) {
  const fm = profile.frontmatter
  const [displayName, setDisplayName] = useState(fm.display_name || "")
  const [headline, setHeadline] = useState(fm.headline || "")
  const [skills, setSkills] = useState((fm.skills || []).join(", "))
  const [experienceYears, setExperienceYears] = useState(
    fm.experience_years != null ? String(fm.experience_years) : ""
  )
  const [preferredRoles, setPreferredRoles] = useState((fm.preferred_roles || []).join(", "))
  const [preferredLocations, setPreferredLocations] = useState(
    (fm.preferred_locations || []).join(", ")
  )
  const [remotePreference, setRemotePreference] = useState(fm.remote_preference || "")
  const [salaryMin, setSalaryMin] = useState(
    fm.salary_range?.min != null ? String(fm.salary_range.min) : ""
  )
  const [salaryMax, setSalaryMax] = useState(
    fm.salary_range?.max != null ? String(fm.salary_range.max) : ""
  )
  const [availability, setAvailability] = useState(fm.availability || "")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!displayName.trim()) newErrors.displayName = "Name is required"
    if (experienceYears && (isNaN(Number(experienceYears)) || Number(experienceYears) < 0))
      newErrors.experienceYears = "Must be a positive number"
    if (salaryMin && isNaN(Number(salaryMin))) newErrors.salaryMin = "Must be a number"
    if (salaryMax && isNaN(Number(salaryMax))) newErrors.salaryMax = "Must be a number"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const parseList = (s: string) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)

    const updates: Record<string, unknown> = {
      display_name: displayName.trim(),
      headline: headline.trim() || undefined,
      skills: parseList(skills),
      experience_years: experienceYears ? Number(experienceYears) : undefined,
      preferred_roles: parseList(preferredRoles),
      preferred_locations: parseList(preferredLocations),
      remote_preference: remotePreference || undefined,
      availability: availability || undefined,
    }

    if (salaryMin || salaryMax) {
      updates.salary_range = {
        min: salaryMin ? Number(salaryMin) : undefined,
        max: salaryMax ? Number(salaryMax) : undefined,
        currency: "USD",
      }
    }

    onSave(updates)
  }

  return (
    <div className="space-y-5">
      <div>
        <InputField
          label="Display Name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="How you want to be known"
        />
        {errors.displayName && (
          <p className="text-xs text-danger mt-1">{errors.displayName}</p>
        )}
      </div>

      <InputField
        label="Headline"
        value={headline}
        onChange={setHeadline}
        placeholder="Senior Backend Engineer | Distributed Systems"
      />

      <InputField
        label="Skills"
        value={skills}
        onChange={setSkills}
        placeholder="TypeScript, React, PostgreSQL, Kubernetes"
      />
      <p className="text-xs text-text-muted -mt-3">Separate skills with commas. Aim for 8-15 industry-standard terms.</p>

      <div>
        <InputField
          label="Years of Experience"
          value={experienceYears}
          onChange={setExperienceYears}
          placeholder="8"
          type="number"
        />
        {errors.experienceYears && (
          <p className="text-xs text-danger mt-1">{errors.experienceYears}</p>
        )}
      </div>

      <InputField
        label="Preferred Roles"
        value={preferredRoles}
        onChange={setPreferredRoles}
        placeholder="Staff Engineer, Tech Lead, Principal Engineer"
      />
      <p className="text-xs text-text-muted -mt-3">Comma-separated list of target roles.</p>

      <InputField
        label="Preferred Locations"
        value={preferredLocations}
        onChange={setPreferredLocations}
        placeholder="San Francisco, New York, Remote"
      />

      <SelectField
        label="Remote Preference"
        value={remotePreference}
        onChange={setRemotePreference}
        options={REMOTE_OPTIONS}
      />

      <div>
        <FieldLabel>Salary Range (USD)</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="Min (e.g. 150000)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            {errors.salaryMin && (
              <p className="text-xs text-danger mt-1">{errors.salaryMin}</p>
            )}
          </div>
          <div>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="Max (e.g. 200000)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            {errors.salaryMax && (
              <p className="text-xs text-danger mt-1">{errors.salaryMax}</p>
            )}
          </div>
        </div>
      </div>

      <SelectField
        label="Availability"
        value={availability}
        onChange={setAvailability}
        options={AVAILABILITY_OPTIONS}
      />

      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Basic Info
        </button>
      </div>
    </div>
  )
}

// --- Experience tab ---
function ExperienceTab({
  profile,
  onSave,
  isPending,
}: {
  profile: ProfileFile
  onSave: (updates: Record<string, unknown>) => void
  isPending: boolean
}) {
  const [entries, setEntries] = useState<Experience[]>(
    profile.frontmatter.experience || []
  )

  const addEntry = () => {
    setEntries([...entries, { company: "", title: "", start: "" }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: string, value: string) => {
    setEntries(
      entries.map((entry, i) => {
        if (i !== index) return entry
        if (field === "skills" || field === "projects") {
          return {
            ...entry,
            [field]: value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          }
        }
        return { ...entry, [field]: value }
      })
    )
  }

  const handleSave = () => {
    const valid = entries.filter((e) => e.company.trim() && e.title.trim())
    onSave({ experience: valid })
  }

  return (
    <div className="space-y-6">
      {entries.length === 0 && (
        <div className="text-center py-12 bg-surface-raised rounded-xl border border-border-subtle">
          <Briefcase className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No experience entries yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Add your work history -- even a rough outline helps find the right opportunities.
          </p>
        </div>
      )}

      {entries.map((entry, i) => (
        <div
          key={i}
          className="bg-surface-raised rounded-xl border border-border-subtle p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Position {i + 1}
            </span>
            <button
              onClick={() => removeEntry(i)}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/8 transition-colors cursor-pointer"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Company"
              value={entry.company}
              onChange={(v) => updateEntry(i, "company", v)}
              placeholder="Acme Corp"
            />
            <InputField
              label="Title"
              value={entry.title}
              onChange={(v) => updateEntry(i, "title", v)}
              placeholder="Senior Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Start Date"
              value={entry.start}
              onChange={(v) => updateEntry(i, "start", v)}
              placeholder="2020-01"
            />
            <InputField
              label="End Date"
              value={entry.end || ""}
              onChange={(v) => updateEntry(i, "end", v)}
              placeholder="Present"
            />
          </div>

          <InputField
            label="Skills Used"
            value={(entry.skills || []).join(", ")}
            onChange={(v) => updateEntry(i, "skills", v)}
            placeholder="TypeScript, React, GraphQL"
          />

          <InputField
            label="Key Projects"
            value={(entry.projects || []).join(", ")}
            onChange={(v) => updateEntry(i, "projects", v)}
            placeholder="Payment Platform, API Gateway"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={addEntry}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Position
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Experience
        </button>
      </div>
    </div>
  )
}

// --- Education tab ---
function EducationTab({
  profile,
  onSave,
  isPending,
}: {
  profile: ProfileFile
  onSave: (updates: Record<string, unknown>) => void
  isPending: boolean
}) {
  const [entries, setEntries] = useState<Education[]>(
    profile.frontmatter.education || []
  )

  const addEntry = () => {
    setEntries([...entries, { institution: "", degree: "" }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: string, value: string) => {
    setEntries(
      entries.map((entry, i) => {
        if (i !== index) return entry
        if (field === "skills") {
          return {
            ...entry,
            [field]: value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          }
        }
        return { ...entry, [field]: value }
      })
    )
  }

  const handleSave = () => {
    const valid = entries.filter((e) => e.institution.trim() && e.degree.trim())
    onSave({ education: valid })
  }

  return (
    <div className="space-y-6">
      {entries.length === 0 && (
        <div className="text-center py-12 bg-surface-raised rounded-xl border border-border-subtle">
          <GraduationCap className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No education entries yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Degrees, bootcamps, certifications -- they all count.
          </p>
        </div>
      )}

      {entries.map((entry, i) => (
        <div
          key={i}
          className="bg-surface-raised rounded-xl border border-border-subtle p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Education {i + 1}
            </span>
            <button
              onClick={() => removeEntry(i)}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/8 transition-colors cursor-pointer"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Institution"
              value={entry.institution}
              onChange={(v) => updateEntry(i, "institution", v)}
              placeholder="Stanford University"
            />
            <InputField
              label="Degree"
              value={entry.degree}
              onChange={(v) => updateEntry(i, "degree", v)}
              placeholder="B.S. Computer Science"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Year"
              value={entry.year || ""}
              onChange={(v) => updateEntry(i, "year", v)}
              placeholder="2018"
            />
            <InputField
              label="Skills Gained"
              value={(entry.skills || []).join(", ")}
              onChange={(v) => updateEntry(i, "skills", v)}
              placeholder="Machine Learning, Python"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={addEntry}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Education
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Education
        </button>
      </div>
    </div>
  )
}

// --- Goals tab ---
function GoalsTab({
  profile,
  onSave,
  isPending,
}: {
  profile: ProfileFile
  onSave: (updates: Record<string, unknown>) => void
  isPending: boolean
}) {
  const [entries, setEntries] = useState<Goal[]>(
    profile.frontmatter.goals || []
  )

  const addEntry = () => {
    setEntries([...entries, { title: "" }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: string, value: string) => {
    setEntries(
      entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    )
  }

  const handleSave = () => {
    const valid = entries.filter((e) => e.title.trim())
    onSave({ goals: valid })
  }

  return (
    <div className="space-y-6">
      {entries.length === 0 && (
        <div className="text-center py-12 bg-surface-raised rounded-xl border border-border-subtle">
          <Target className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No career goals yet.</p>
          <p className="text-xs text-text-muted mt-1">
            What are you working toward? Defining goals helps focus your search.
          </p>
        </div>
      )}

      {entries.map((entry, i) => (
        <div
          key={i}
          className="bg-surface-raised rounded-xl border border-border-subtle p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Goal {i + 1}
            </span>
            <button
              onClick={() => removeEntry(i)}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/8 transition-colors cursor-pointer"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <InputField
            label="Title"
            value={entry.title}
            onChange={(v) => updateEntry(i, "title", v)}
            placeholder="Break into staff engineering"
          />

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={entry.description || ""}
              onChange={(e) => updateEntry(i, "description", e.target.value)}
              placeholder="What does this goal look like? What steps are you taking?"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors resize-none"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={addEntry}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Goals
        </button>
      </div>
    </div>
  )
}

// --- Resume tab ---

// Fix bold markers with trailing whitespace before the closing **.
// CommonMark requires closing ** to be "right-flanking" (no preceding spaces).
// Uploaded resumes often produce patterns like "**Title  **rest" — move the
// spaces outside so the parser sees "**Title**  rest".
function normalizeBoldMarkers(md: string): string {
  return md.replace(/\*\*([^*]+?)\s{2,}\*\*/g, "**$1**  ")
}

function ResumeTab({ content }: { content: string | null }) {
  if (!content) {
    return (
      <div className="text-center py-12 bg-surface-raised rounded-xl border border-border-subtle">
        <FileText className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-secondary">No base resume found.</p>
        <p className="text-xs text-text-muted mt-1">
          Upload a resume from the hub to generate your base resume.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-raised rounded-xl border border-border-subtle p-6 sm:p-8">
      <div className="prose prose-sm max-w-none text-text-primary prose-headings:font-prose prose-headings:text-text-primary prose-h1:text-xl prose-h1:mb-4 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-p:text-sm prose-p:leading-relaxed prose-p:text-text-secondary prose-li:text-sm prose-li:text-text-secondary prose-strong:text-text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-hr:border-border-subtle">
        <Markdown remarkPlugins={[remarkGfm]}>{normalizeBoldMarkers(content)}</Markdown>
      </div>
    </div>
  )
}

// --- Main editor ---
export function ProfileEditor({ profile, resumeContent }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("basic")
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(
    null
  )

  const handleSave = (updates: Record<string, unknown>) => {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateProfile(updates)
      if (result.error) {
        setFeedback({ status: "error", message: result.error })
      } else {
        setFeedback({ status: "success", message: "Profile updated successfully." })
      }
    })
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-surface-overlay rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setFeedback(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-surface-raised text-accent font-medium shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && <FeedbackBanner status={feedback.status} message={feedback.message} />}

      {/* Tab content */}
      {activeTab === "basic" && (
        <BasicInfoTab profile={profile} onSave={handleSave} isPending={isPending} />
      )}
      {activeTab === "experience" && (
        <ExperienceTab profile={profile} onSave={handleSave} isPending={isPending} />
      )}
      {activeTab === "education" && (
        <EducationTab profile={profile} onSave={handleSave} isPending={isPending} />
      )}
      {activeTab === "goals" && (
        <GoalsTab profile={profile} onSave={handleSave} isPending={isPending} />
      )}
      {activeTab === "resume" && (
        <ResumeTab content={resumeContent} />
      )}
    </div>
  )
}
