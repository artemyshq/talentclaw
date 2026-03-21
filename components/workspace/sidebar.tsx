import { CrabLogo } from "@/components/crab-logo"
import { SidebarNav } from "./sidebar-nav"
import { ThemeToggle } from "./theme-toggle"
import { SidebarCollapseToggle } from "./sidebar-collapse-toggle"
import type { TreeNode } from "@/lib/types"

interface SidebarProps {
  jobCount: number
  activeCount: number
  tree: TreeNode[]
}

export function Sidebar({
  jobCount,
  activeCount,
  tree,
}: SidebarProps) {
  return (
    <>
      {/* Brand */}
      <div className="px-3 h-14 flex items-center gap-2.5 border-b border-border-sidebar shrink-0">
        <div className="w-7 h-7 flex items-center justify-center shrink-0">
          <CrabLogo className="w-7 h-7 text-accent" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-text-primary whitespace-nowrap overflow-hidden">
          talentclaw
        </span>
      </div>

      {/* Navigation (client) */}
      <SidebarNav
        jobCount={jobCount}
        activeCount={activeCount}
        tree={tree}
      />

      {/* Footer */}
      <div className="shrink-0 border-t border-border-sidebar px-2 py-2 flex flex-col gap-1">
        <ThemeToggle />
        <SidebarCollapseToggle />
      </div>
    </>
  )
}
