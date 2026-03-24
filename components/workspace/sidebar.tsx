import { SidebarNav } from "./sidebar-nav"

interface SidebarProps {
  jobCount: number
  activeCount: number
}

export function Sidebar({
  jobCount,
  activeCount,
}: SidebarProps) {
  return (
    <SidebarNav
      jobCount={jobCount}
      activeCount={activeCount}
    />
  )
}
