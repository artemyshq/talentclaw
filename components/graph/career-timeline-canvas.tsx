'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { TimelineBranch } from '@/lib/timeline-data'

// ---------------------------------------------------------------------------
// Internal layout types
// ---------------------------------------------------------------------------

interface AxonPoint {
  x: number
  y: number
}

interface LayoutBranch extends TimelineBranch {
  idx: number
  forkX: number
  forkAxonY: number
  mergeX: number
  mergeAxonY: number
  parallelStartX: number
  parallelEndX: number
  parallelY: number
  pathPoints: AxonPoint[]
  isCurrent: boolean
  branchPxWidth: number
  growDelay: number
}

interface Pulse {
  t: number
  speed: number
  size: number
  brightness: number
}

interface Particle {
  branch: LayoutBranch
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

interface YearMarker {
  year: number
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Fonts (system only, no Google Fonts)
// ---------------------------------------------------------------------------

const FONT_SANS = '"Avenir Next", "Avenir", -apple-system, sans-serif'
const FONT_MONO = '"SF Mono", "Fira Code", ui-monospace, monospace'

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// ---------------------------------------------------------------------------
// Seeded random (deterministic wobble)
// ---------------------------------------------------------------------------

function createSeededRandom(initial: number = 42) {
  let seed = initial
  return () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// ---------------------------------------------------------------------------
// Module-level fitText (hoisted out of render loop)
// ---------------------------------------------------------------------------

function fitText(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string {
  ctx.font = font
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(truncated + '\u2026').width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '\u2026'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CareerTimelineCanvas({
  branches,
}: {
  branches: TimelineBranch[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mutable refs for layout + animation state
  const layoutRef = useRef<{
    axonPoints: AxonPoint[]
    branches: LayoutBranch[]
    pulses: Pulse[]
    particles: Particle[]
    yearMarkers: YearMarker[]
  }>({
    axonPoints: [],
    branches: [],
    pulses: [],
    particles: [],
    yearMarkers: [],
  })

  const sizeRef = useRef({ w: 0, h: 0 })
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const lastHoverMouseRef = useRef({ x: -9999, y: -9999 })
  const hoveredRef = useRef<LayoutBranch | null>(null)
  const growthStartRef = useRef(0)
  const animFrameRef = useRef(0)
  const lastTooltipRef = useRef<{ branchIdx: number; x: number; y: number } | null>(null)

  // React state for tooltip (rendered in JSX, not on canvas)
  const [tooltip, setTooltip] = useState<{
    branch: LayoutBranch
    x: number
    y: number
  } | null>(null)

  const GROWTH_DURATION = 3500

  // ---------------------------------------------------------------------------
  // Particle factory
  // ---------------------------------------------------------------------------

  const createParticle = useCallback((branch: LayoutBranch): Particle => {
    const cx = (branch.parallelStartX + branch.parallelEndX) / 2
    const cy = branch.parallelY
    return {
      branch,
      x: cx + (Math.random() - 0.5) * 30,
      y: cy + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      life: Math.random(),
      maxLife: 3 + Math.random() * 4,
      size: 1 + Math.random() * 1.5,
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Layout computation
  // ---------------------------------------------------------------------------

  const computeLayout = useCallback(() => {
    const W = sizeRef.current.w
    const H = sizeRef.current.h
    if (W === 0 || H === 0) return

    const layout = layoutRef.current
    layout.branches = []
    layout.axonPoints = []
    layout.yearMarkers = []
    layout.particles = []

    const padL = 120
    const padR = 80
    const axonY = H * 0.5

    // Derive year range from data
    let dataMinYear = Infinity
    let dataMaxYear = -Infinity
    for (const e of branches) {
      if (e.startYear < dataMinYear) dataMinYear = e.startYear
      if (e.endYear > dataMaxYear) dataMaxYear = e.endYear
    }
    if (!isFinite(dataMinYear)) return

    const currentYear = new Date().getFullYear()
    const minYear = dataMinYear - 1
    const maxYear = Math.max(dataMaxYear, currentYear) + 0.8
    const yearSpan = maxYear - minYear

    function yearToX(y: number): number {
      return padL + ((y - minYear) / yearSpan) * (W - padL - padR)
    }

    // Year markers -- adapt density based on span
    const totalYears = Math.ceil(maxYear) - Math.floor(minYear)
    let yearStep = 1
    if (totalYears > 30) yearStep = 5
    else if (totalYears > 15) yearStep = 2

    for (
      let y = Math.ceil(dataMinYear / yearStep) * yearStep;
      y <= Math.floor(maxYear);
      y += yearStep
    ) {
      layout.yearMarkers.push({ year: y, x: yearToX(y), y: axonY })
    }

    // Axon path with gentle organic wobble
    const axonSegments = 400
    for (let i = 0; i <= axonSegments; i++) {
      const t = i / axonSegments
      const x = padL + t * (W - padL - padR)
      const wobble = Math.sin(t * Math.PI * 3) * 4 + Math.sin(t * Math.PI * 7) * 1.5
      layout.axonPoints.push({ x, y: axonY + wobble })
    }

    // O(1) axon Y lookup instead of O(401) linear scan
    function axonYAtX(targetX: number): number {
      const t = (targetX - padL) / (W - padL - padR)
      const idx = Math.max(0, Math.min(axonSegments, Math.round(t * axonSegments)))
      return layout.axonPoints[idx].y
    }

    // Adaptive transition width based on timeline density
    const pxPerYear = (W - padL - padR) / yearSpan
    const transitionYears = Math.min(0.4, pxPerYear > 60 ? 0.4 : 0.2)

    branches.forEach((entry, idx) => {
      const isCurrent = entry.endYear >= currentYear
      const side = entry.side
      const offsetY = entry.offsetY * side

      // Key x positions
      const forkX = yearToX(entry.startYear)
      const forkAxonY = axonYAtX(forkX)
      const mergeX = yearToX(entry.endYear)
      const mergeAxonY = axonYAtX(mergeX)

      // Transition widths
      const transitionPx = yearToX(entry.startYear + transitionYears) - forkX
      const minTransition = 8
      const actualTransitionPx = Math.max(transitionPx, minTransition)
      const parallelStartX = forkX + actualTransitionPx
      const parallelEndX = isCurrent
        ? mergeX
        : Math.max(mergeX - actualTransitionPx, parallelStartX)
      const parallelY = forkAxonY + offsetY

      // Build path points
      const pathPoints: AxonPoint[] = []
      const pathSegments = 80

      for (let i = 0; i <= pathSegments; i++) {
        const t = i / pathSegments
        const totalLen = mergeX - forkX
        const currentX = forkX + t * totalLen
        let currentY: number

        if (currentX <= parallelStartX) {
          const forkT = (currentX - forkX) / (parallelStartX - forkX || 1)
          const eased = forkT * forkT * (3 - 2 * forkT) // smoothstep
          const localAxonY = axonYAtX(currentX)
          currentY = localAxonY + offsetY * eased
        } else if (currentX >= parallelEndX && !isCurrent) {
          const mergeT = (currentX - parallelEndX) / (mergeX - parallelEndX || 1)
          const eased = mergeT * mergeT * (3 - 2 * mergeT)
          currentY = parallelY + (mergeAxonY - parallelY) * eased
        } else {
          const wobbleT =
            (currentX - parallelStartX) /
            Math.max(parallelEndX - parallelStartX, 1)
          const wobble = Math.sin(wobbleT * Math.PI * 2 + idx) * 2
          currentY = parallelY + wobble
        }

        pathPoints.push({ x: currentX, y: currentY })
      }

      layout.branches.push({
        ...entry,
        idx,
        forkX,
        forkAxonY,
        mergeX,
        mergeAxonY,
        parallelStartX,
        parallelEndX,
        parallelY,
        pathPoints,
        isCurrent,
        branchPxWidth: mergeX - forkX,
        growDelay: idx * (0.6 / Math.max(branches.length, 1)),
      })
    })

    // Axon pulses -- evenly spaced, steady flow
    layout.pulses = []
    const pulseCount = 5
    for (let i = 0; i < pulseCount; i++) {
      layout.pulses.push({
        t: i / pulseCount,
        speed: 0.00035,
        size: 3,
        brightness: 0.3, // subtler on light theme
      })
    }

    // Particles
    layout.branches.forEach((br) => {
      const count = 4
      for (let i = 0; i < count; i++) {
        layout.particles.push(createParticle(br))
      }
    })
  }, [branches, createParticle])

  // ---------------------------------------------------------------------------
  // Drawing functions
  // ---------------------------------------------------------------------------

  const drawAxon = useCallback(
    (ctx: CanvasRenderingContext2D, time: number, gp: number) => {
      const { axonPoints } = layoutRef.current
      if (axonPoints.length < 2) return
      const visibleCount = Math.floor(axonPoints.length * Math.min(gp * 1.3, 1))
      if (visibleCount < 2) return

      const breathe = 1 + Math.sin(time * 0.0008) * 0.005

      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Soft glow
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.03)'
      ctx.lineWidth = 6 * breathe
      ctx.beginPath()
      ctx.moveTo(axonPoints[0].x, axonPoints[0].y)
      for (let i = 1; i < visibleCount; i++) ctx.lineTo(axonPoints[i].x, axonPoints[i].y)
      ctx.stroke()

      // Core line
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.1)'
      ctx.lineWidth = 1.2 * breathe
      ctx.beginPath()
      ctx.moveTo(axonPoints[0].x, axonPoints[0].y)
      for (let i = 1; i < visibleCount; i++) ctx.lineTo(axonPoints[i].x, axonPoints[i].y)
      ctx.stroke()

      ctx.restore()

      // Pulses
      const { pulses } = layoutRef.current
      pulses.forEach((pulse) => {
        pulse.t += pulse.speed
        if (pulse.t > 1) pulse.t -= 1
        const idx = Math.floor(pulse.t * (visibleCount - 1))
        if (idx >= 0 && idx < visibleCount) {
          const pt = axonPoints[idx]
          const alpha = pulse.brightness
          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pulse.size * 3)
          grad.addColorStop(0, `rgba(28, 25, 23, ${alpha * 0.5})`)
          grad.addColorStop(0.5, `rgba(28, 25, 23, ${alpha * 0.1})`)
          grad.addColorStop(1, 'rgba(28, 25, 23, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, pulse.size * 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    },
    []
  )

  const drawBranch = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      branch: LayoutBranch,
      time: number,
      gp: number,
      hovered: LayoutBranch | null
    ) => {
      const brGrow = Math.max(0, Math.min(1, (gp - branch.growDelay) / 0.2))
      if (brGrow <= 0) return

      const isHovered = hovered === branch
      const breathe = 1 + Math.sin(time * 0.001 + branch.idx * 1.5) * 0.015
      const dimFactor = hovered && !isHovered ? 0.15 : 1

      const pts = branch.pathPoints
      const visibleCount = Math.floor(pts.length * Math.min(brGrow * 1.3, 1))
      if (visibleCount < 2) return

      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // -- Fork junction dot --
      ctx.fillStyle = hexToRgba(branch.color, 0.6 * dimFactor)
      ctx.beginPath()
      ctx.arc(branch.forkX, branch.forkAxonY, (isHovered ? 3.5 : 2.5) * breathe, 0, Math.PI * 2)
      ctx.fill()

      // -- Branch path: soft glow --
      ctx.strokeStyle = hexToRgba(
        branch.color,
        (isHovered ? 0.1 : 0.04) * dimFactor
      )
      ctx.lineWidth = 6 * breathe
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < visibleCount; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()

      // Branch path: core line
      ctx.strokeStyle = hexToRgba(
        branch.color,
        (isHovered ? 0.7 : 0.4) * dimFactor
      )
      ctx.lineWidth = 1.5 * breathe
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < visibleCount; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()

      // -- Merge junction dot (if not current) --
      if (!branch.isCurrent && brGrow > 0.9) {
        const mAlpha = (brGrow - 0.9) / 0.1
        ctx.fillStyle = hexToRgba(branch.color, 0.5 * dimFactor * mAlpha)
        ctx.beginPath()
        ctx.arc(branch.mergeX, branch.mergeAxonY, (isHovered ? 3 : 2) * breathe, 0, Math.PI * 2)
        ctx.fill()
      }

      // -- Labels -- adaptive sizing based on branch pixel width --
      if (brGrow > 0.4) {
        const midX = (branch.parallelStartX + branch.parallelEndX) / 2

        let labelY = branch.parallelY
        for (const pp of pts) {
          if (Math.abs(pp.x - midX) < 5) {
            labelY = pp.y
            break
          }
        }

        const clearance = 10
        const glowHalf = 7

        // Scale font size for narrow branches
        const bw = branch.branchPxWidth
        const nameFontSize = Math.max(10, Math.min(13, bw * 0.08))
        const roleFontSize = Math.max(8, Math.min(10, bw * 0.06))
        const nameWeight = '600'

        const maxLabelWidth = Math.max(bw * 1.4, 80)
        const nameFont = `${nameWeight} ${nameFontSize}px ${FONT_SANS}`
        const roleFont = `${roleFontSize}px ${FONT_MONO}`
        const nameText = fitText(ctx, branch.name, nameFont, maxLabelWidth)
        const roleText = fitText(ctx, branch.role, roleFont, maxLabelWidth)

        // Company name color: branch color at 0.8 normal, 1.0 hovered
        const nameAlpha = (isHovered ? 1.0 : 0.8) * dimFactor
        // Role color: text-secondary rgba(87, 83, 78) at 0.5 normal, 0.7 hovered
        const roleAlpha = (isHovered ? 0.7 : 0.5) * dimFactor

        if (branch.side === -1) {
          // Above the axon: role above the branch, company name above that
          const baseY = labelY - glowHalf - clearance

          if (brGrow > 0.6) {
            ctx.font = roleFont
            ctx.fillStyle = `rgba(87, 83, 78, ${roleAlpha})`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(roleText, midX, baseY)
          }

          ctx.font = nameFont
          ctx.fillStyle = hexToRgba(branch.color, nameAlpha)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(nameText, midX, baseY - (roleFontSize + 4))
        } else {
          // Below the axon: company name below, role below that
          const baseY = labelY + glowHalf + clearance

          ctx.font = nameFont
          ctx.fillStyle = hexToRgba(branch.color, nameAlpha)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(nameText, midX, baseY)

          if (brGrow > 0.6) {
            ctx.font = roleFont
            ctx.fillStyle = `rgba(87, 83, 78, ${roleAlpha})`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(roleText, midX, baseY + nameFontSize + 3)
          }
        }
      }

      ctx.restore()
    },
    []
  )

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, _time: number, gp: number, hovered: LayoutBranch | null) => {
      const { particles } = layoutRef.current
      particles.forEach((p, i) => {
        const brGrow = Math.max(0, Math.min(1, (gp - p.branch.growDelay) / 0.2))
        if (brGrow < 0.7) return

        p.x += p.vx
        p.y += p.vy
        p.life += 0.016 / p.maxLife

        if (p.life > 1) {
          particles[i] = createParticle(p.branch)
          return
        }

        const isHovered = hovered === p.branch
        const dimFactor = hovered && !isHovered ? 0.15 : 1
        const alpha = Math.sin(p.life * Math.PI) * (isHovered ? 0.35 : 0.12) * dimFactor

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        grad.addColorStop(0, hexToRgba(p.branch.color, alpha))
        grad.addColorStop(1, hexToRgba(p.branch.color, 0))
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()
      })
    },
    [createParticle]
  )

  const drawYearMarkers = useCallback(
    (ctx: CanvasRenderingContext2D, _time: number, gp: number) => {
      const { yearMarkers } = layoutRef.current
      yearMarkers.forEach((ym, i) => {
        const yearProgress = Math.max(0, Math.min(1, gp * 14 - i * 0.8))
        if (yearProgress <= 0) return

        ctx.save()

        // Tick mark on the axon
        const tickLen = 6
        ctx.strokeStyle = `rgba(87, 83, 78, ${0.2 * yearProgress})`
        ctx.lineWidth = 0.75
        ctx.beginPath()
        ctx.moveTo(ym.x, ym.y - tickLen)
        ctx.lineTo(ym.x, ym.y + tickLen)
        ctx.stroke()

        // Year label below the tick
        ctx.font = `10px ${FONT_MONO}`
        ctx.fillStyle = `rgba(87, 83, 78, ${0.45 * yearProgress})`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(ym.year.toString(), ym.x, ym.y + tickLen + 4)

        ctx.restore()
      })
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Hit testing
  // ---------------------------------------------------------------------------

  const updateHover = useCallback(() => {
    const mouse = mouseRef.current

    // Skip when mouse hasn't moved
    if (mouse.x === lastHoverMouseRef.current.x && mouse.y === lastHoverMouseRef.current.y) return
    lastHoverMouseRef.current = { x: mouse.x, y: mouse.y }

    const { branches: layoutBranches } = layoutRef.current
    let found: LayoutBranch | null = null

    for (const br of layoutBranches) {
      for (const pp of br.pathPoints) {
        const dx = mouse.x - pp.x
        const dy = mouse.y - pp.y
        if (Math.abs(dx) < 15 && Math.abs(dy) < 20) {
          found = br
          break
        }
      }
      if (found) break
    }

    const prev = hoveredRef.current
    hoveredRef.current = found

    // Compute tooltip position
    if (found) {
      const W = sizeRef.current.w
      const H = sizeRef.current.h
      let tx = mouse.x + 20
      let ty = mouse.y - 10
      if (tx + 260 > W) tx = mouse.x - 280
      if (ty + 150 > H) ty = mouse.y - 150
      if (ty < 10) ty = 10

      // Skip setTooltip if branch and position unchanged
      const last = lastTooltipRef.current
      if (last && last.branchIdx === found.idx && last.x === tx && last.y === ty) return
      lastTooltipRef.current = { branchIdx: found.idx, x: tx, y: ty }
      setTooltip({ branch: found, x: tx, y: ty })
    } else if (prev) {
      // Only clear if we were previously hovering something
      lastTooltipRef.current = null
      setTooltip(null)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Resize + layout
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = container!.getBoundingClientRect()
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      computeLayout()
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [computeLayout])

  // ---------------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    growthStartRef.current = 0

    function render(time: number) {
      if (!growthStartRef.current) growthStartRef.current = time
      const elapsed = time - growthStartRef.current
      const rawGP = Math.min(elapsed / GROWTH_DURATION, 1)
      const gp = easeOutQuart(rawGP)

      const { w: W, h: H } = sizeRef.current
      const layout = layoutRef.current
      const hovered = hoveredRef.current

      // Clear with white
      ctx!.fillStyle = '#ffffff'
      ctx!.fillRect(0, 0, W, H)

      drawAxon(ctx!, time, gp)
      layout.branches.forEach((br) => drawBranch(ctx!, br, time, gp, hovered))
      drawParticles(ctx!, time, gp, hovered)
      drawYearMarkers(ctx!, time, gp)

      updateHover()

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [drawAxon, drawBranch, drawParticles, drawYearMarkers, updateHover])

  // ---------------------------------------------------------------------------
  // Mouse event handlers
  // ---------------------------------------------------------------------------

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 }
    lastHoverMouseRef.current = { x: -9999, y: -9999 }
    hoveredRef.current = null
    lastTooltipRef.current = null
    setTooltip(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (branches.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-text-muted text-sm">
        Add experience to your profile to see your career timeline.
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-border-subtle rounded-lg shadow-md p-3 text-sm max-w-[260px]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            className="font-semibold text-sm mb-0.5"
            style={{ fontFamily: FONT_SANS, color: tooltip.branch.color }}
          >
            {tooltip.branch.name}
          </div>
          <div
            className="text-text-secondary text-xs mb-2"
            style={{ fontFamily: FONT_SANS }}
          >
            {tooltip.branch.role}
          </div>
          {tooltip.branch.skills.length > 0 && (
            <div
              className="text-[11px] text-text-secondary leading-relaxed"
              style={{ fontFamily: FONT_MONO }}
            >
              {tooltip.branch.skills.join(' \u00B7 ')}
            </div>
          )}
          {tooltip.branch.projects.length > 0 && (
            <div
              className="mt-1.5 text-[10px] text-text-muted"
              style={{ fontFamily: FONT_MONO }}
            >
              Projects: {tooltip.branch.projects.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
