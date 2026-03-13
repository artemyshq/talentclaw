import { CoffeeShopLogo } from "@/components/coffeeshop-logo"
import type { CoffeeShopStatus } from "@/lib/fs-data"

interface CoffeeShopCardProps {
  status: CoffeeShopStatus
}

export function CoffeeShopCard({ status }: CoffeeShopCardProps) {
  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-5">
      <div className="flex items-center gap-3">
        <CoffeeShopLogo className="w-8 h-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Coffee Shop
            </h3>
            {status.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600">
                  Connected
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-overlay border border-border-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
                <span className="text-[11px] font-medium text-text-muted">
                  Not connected
                </span>
              </span>
            )}
          </div>
          {status.connected ? (
            <p className="text-xs text-text-secondary mt-1 truncate">
              {status.agentId
                ? `Registered as ${status.agentId}`
                : "Registered on the talent network"}
            </p>
          ) : (
            <p className="text-xs text-text-muted mt-1">
              Ask your agent to get you connected.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
