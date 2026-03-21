"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useSidebar } from "./sidebar-wrapper"

export function SidebarCollapseToggle() {
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <button
      onClick={toggleCollapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="hidden md:flex items-center justify-center w-8 h-8 mx-auto rounded-lg
        text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
    >
      {collapsed ? (
        <PanelLeftOpen className="w-4 h-4" />
      ) : (
        <PanelLeftClose className="w-4 h-4" />
      )}
    </button>
  )
}
