interface DiffLine {
  type: "added" | "removed" | "unchanged"
  content: string
}

interface ResumeDiffProps {
  original: string
  tailored: string
  rationale?: string
}

function computeDiffLines(original: string, tailored: string): DiffLine[] {
  const origLines = original.split("\n")
  const tailLines = tailored.split("\n")
  const lines: DiffLine[] = []

  const origSet = new Set(origLines)
  const tailSet = new Set(tailLines)

  // Simple line-based diff: removed lines, then interleave unchanged + added
  const maxLen = Math.max(origLines.length, tailLines.length)
  let oi = 0
  let ti = 0

  while (oi < origLines.length || ti < tailLines.length) {
    if (oi < origLines.length && ti < tailLines.length && origLines[oi] === tailLines[ti]) {
      lines.push({ type: "unchanged", content: origLines[oi] })
      oi++
      ti++
    } else if (oi < origLines.length && !tailSet.has(origLines[oi])) {
      lines.push({ type: "removed", content: origLines[oi] })
      oi++
    } else if (ti < tailLines.length && !origSet.has(tailLines[ti])) {
      lines.push({ type: "added", content: tailLines[ti] })
      ti++
    } else {
      // Fallback: treat as remove + add
      if (oi < origLines.length) {
        lines.push({ type: "removed", content: origLines[oi] })
        oi++
      }
      if (ti < tailLines.length) {
        lines.push({ type: "added", content: tailLines[ti] })
        ti++
      }
    }

    // Safety valve
    if (lines.length > maxLen * 3) break
  }

  return lines
}

export function ResumeDiff({ original, tailored, rationale }: ResumeDiffProps) {
  if (!tailored || original === tailored) {
    return (
      <div className="bg-surface-raised rounded-xl p-4">
        <h3 className="font-prose text-lg text-text-primary">
          No changes — profile sent as-is
        </h3>
      </div>
    )
  }

  const diffLines = computeDiffLines(original, tailored)

  return (
    <div className="bg-surface-raised rounded-xl p-4">
      <h3 className="font-prose text-lg text-text-primary mb-3">
        How your application was tailored
      </h3>
      <div className="font-mono text-sm rounded-lg bg-surface-overlay p-3 overflow-x-auto">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "added"
                ? "bg-emerald-500/10 text-emerald-400"
                : line.type === "removed"
                  ? "bg-red-400/10 text-red-400"
                  : "text-text-muted"
            }
          >
            <span className="select-none inline-block w-4 text-right mr-2 opacity-50">
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </span>
            {line.content || "\u00a0"}
          </div>
        ))}
      </div>
      {rationale && (
        <p className="text-xs text-text-secondary mt-2">{rationale}</p>
      )}
    </div>
  )
}
