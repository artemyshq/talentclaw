"use client"

import { useState } from "react"
import Link from "next/link"
import { Cog, Menu, X } from "lucide-react"

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Cog className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            TalentClaw
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8 list-none">
          <li>
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              How it works
            </a>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <a
              href="https://github.com/artemyshq/talentclaw"
              className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Get Started
            </a>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed top-16 left-0 right-0 bottom-0 bg-surface z-[99] flex flex-col items-center justify-center gap-10 md:hidden">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-text-primary"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-text-primary"
          >
            How it works
          </a>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-text-primary"
          >
            Dashboard
          </Link>
          <a
            href="https://github.com/artemyshq/talentclaw"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-accent"
          >
            Get Started
          </a>
        </div>
      )}
    </nav>
  )
}
