export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  url TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'discovered',
  compensation_min INTEGER,
  compensation_max INTEGER,
  remote BOOLEAN,
  location TEXT,
  skills TEXT,
  notes TEXT,
  coffeeshop_job_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  status TEXT DEFAULT 'discovered',
  applied_at TIMESTAMP,
  coffeeshop_application_id TEXT,
  match_reasoning TEXT,
  next_step TEXT,
  next_step_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  size TEXT,
  industry TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  sender TEXT,
  content TEXT,
  sent_at TIMESTAMP,
  coffeeshop_message_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

export const PIPELINE_STAGES = [
  "discovered",
  "saved",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export interface Job {
  id: string
  title: string
  company: string | null
  url: string | null
  source: string
  status: string
  compensation_min: number | null
  compensation_max: number | null
  remote: boolean | null
  location: string | null
  skills: string | null
  notes: string | null
  coffeeshop_job_id: string | null
  created_at: string
}

export interface Application {
  id: string
  job_id: string
  status: string
  applied_at: string | null
  coffeeshop_application_id: string | null
  match_reasoning: string | null
  next_step: string | null
  next_step_date: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  url: string | null
  size: string | null
  industry: string | null
  notes: string | null
  created_at: string
}

export interface Contact {
  id: string
  company_id: string | null
  name: string
  title: string | null
  email: string | null
  linkedin: string | null
  notes: string | null
  created_at: string
}

export interface Message {
  id: string
  application_id: string | null
  sender: string | null
  content: string | null
  sent_at: string | null
  coffeeshop_message_id: string | null
  created_at: string
}
