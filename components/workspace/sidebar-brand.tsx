"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"
import { useSidebar } from "./sidebar-wrapper"

export function SidebarBrand() {
  const { collapsed, toggleCollapsed } = useSidebar()

  /* The title bar row: 52px tall to vertically center content with the macOS
     traffic lights (which sit at y≈18). Traffic lights span x≈10–62, so the
     collapsed sidebar (48px) can only fit an icon below them, while the
     expanded sidebar (256px) has room to the right. */

  if (collapsed) {
    return (
      <div className="shrink-0 h-[52px] flex items-end justify-center pb-1.5">
        <button
          onClick={toggleCollapsed}
          title="Expand sidebar"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="shrink-0 h-[52px] flex items-center pl-[78px] pr-3">
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        <CrabLogo className="w-6 h-6 text-accent" />
      </div>
      <span className="ml-2 text-[15px] font-semibold tracking-tight text-text-primary whitespace-nowrap overflow-hidden">
        talentclaw
      </span>
      <button
        onClick={toggleCollapsed}
        title="Collapse sidebar"
        className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer shrink-0"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>
    </div>
  )
}
