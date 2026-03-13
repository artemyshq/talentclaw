export interface GraphNode {
  id: string
  label: string
  type: 'person' | 'company' | 'education' | 'role' | 'skill' | 'project' | 'industry'
  cluster: 'center' | 'companies' | 'titles' | 'skills' | 'projects' | 'education' | 'industries'
  detail?: string
  size: number
}

export interface GraphEdge {
  source: string
  target: string
}

export const CLUSTER_COLORS: Record<string, string> = {
  center: '#059669',
  companies: '#3b82f6',
  titles: '#8b5cf6',
  skills: '#f59e0b',
  projects: '#ec4899',
  education: '#06b6d4',
  industries: '#f97316',
}

export const NODE_COLORS: Record<string, string> = {
  person: '#059669',
  company: '#3b82f6',
  role: '#8b5cf6',
  skill: '#f59e0b',
  project: '#ec4899',
  education: '#06b6d4',
  industry: '#f97316',
}

export const CLUSTER_DESCRIPTIONS: Record<string, string> = {
  companies: "Where you've been",
  titles: "Roles you've held",
  skills: 'What you know',
  projects: "What you've built",
  education: 'Where you studied',
  industries: 'Domains you know',
}

export const TYPE_LABELS: Record<string, string> = {
  company: 'COMPANY',
  role: 'ROLE',
  skill: 'SKILL',
  project: 'PROJECT',
  education: 'EDUCATION',
  industry: 'INDUSTRY',
  person: 'YOU',
}
