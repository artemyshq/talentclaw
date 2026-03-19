import { scoreColor, barColor } from "@/lib/ui-utils"

interface ConfidenceMeterProps {
  score: number
  reasoning?: string
  qualifier?: string
}

export function ConfidenceMeter({ score, reasoning, qualifier }: ConfidenceMeterProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full bg-surface-overlay overflow-hidden"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Application confidence: ${score}%`}
        >
          <div
            className={`h-full rounded-full ${barColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
      {reasoning && (
        <p className="text-xs text-text-muted mt-1">{reasoning}</p>
      )}
      {qualifier && (
        <p className="text-[11px] text-text-muted mt-0.5">{qualifier}</p>
      )}
    </div>
  )
}
