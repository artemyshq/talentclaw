import { Cog } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 px-5 border-t border-border-subtle">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <Cog className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm text-text-muted">TalentClaw by Artemys</span>
        </div>
        <ul className="flex gap-8 list-none">
          <li>
            <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Privacy
            </a>
          </li>
          <li>
            <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Terms
            </a>
          </li>
          <li>
            <a
              href="https://github.com/artemyshq"
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
