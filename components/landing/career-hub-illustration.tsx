// ---------------------------------------------------------------------------
// Career Hub — realistic SVG illustration for the landing page
// Faithfully represents the actual dashboard layout:
//   1. Full-width Profile Card (greeting, momentum ring, pipeline pills,
//      briefing stats, compact actions, agent insights)
//   2. Full-width Career Context Graph (d3-force constellation)
//   3. 2-column bottom row: Activity Feed (left) + Upcoming Actions (right)
// ---------------------------------------------------------------------------

const FONT_SERIF = '"Instrument Serif", Georgia, serif'
const FONT_SANS = '"DM Sans", system-ui, sans-serif'
const FONT_MONO = '"JetBrains Mono", monospace'

// -- Layout constants --------------------------------------------------------

const SIDEBAR_W = 178
const CX = SIDEBAR_W + 24 // content left edge (202)
const CR = 936 // content right edge
const CW = CR - CX // content width (734)

const PROFILE = { x: CX, y: 56, w: CW, h: 200 }
const GRAPH = { x: CX, y: 266, w: CW, h: 204 }
const FEED = { x: CX, y: 480, w: 358, h: 136 }
const ACTIONS = { x: CX + 374, y: 480, w: 360, h: 136 }

// -- Career graph data (wide aspect ratio) -----------------------------------

const graphNodes = [
  // Person (center) — card center ≈ y=368
  { id: "alex", x: 569, y: 361, r: 14, label: "Alex Chen", color: "#059669" },
  // Companies (blue, upper-right cluster)
  { id: "stripe", x: 710, y: 323, r: 9, label: "Stripe", color: "#3b82f6" },
  { id: "figma", x: 745, y: 364, r: 8, label: "Figma", color: "#3b82f6" },
  { id: "plaid", x: 692, y: 353, r: 7, label: "Plaid", color: "#3b82f6" },
  // Roles (purple, right)
  { id: "staffeng", x: 738, y: 400, r: 8, label: "Staff Engineer", color: "#8b5cf6" },
  { id: "srfront", x: 682, y: 410, r: 7, label: "Sr. Frontend", color: "#8b5cf6" },
  { id: "techlead", x: 660, y: 313, r: 7, label: "Tech Lead", color: "#8b5cf6" },
  // Skills (amber, left cluster)
  { id: "react", x: 420, y: 331, r: 9, label: "React", color: "#f59e0b" },
  { id: "ts", x: 385, y: 364, r: 8, label: "TypeScript", color: "#f59e0b" },
  { id: "graphql", x: 455, y: 306, r: 7, label: "GraphQL", color: "#f59e0b" },
  { id: "dessys", x: 350, y: 336, r: 7, label: "Design Systems", color: "#f59e0b" },
  // Projects (pink, lower-left)
  { id: "payments", x: 408, y: 406, r: 7, label: "Payments SDK", color: "#ec4899" },
  { id: "destok", x: 452, y: 419, r: 6, label: "Design Tokens", color: "#ec4899" },
  { id: "apigw", x: 365, y: 413, r: 6, label: "API Gateway", color: "#ec4899" },
  // Education (cyan, top center)
  { id: "stanford", x: 585, y: 299, r: 8, label: "Stanford CS", color: "#06b6d4" },
  // Industries (orange, bottom)
  { id: "fintech", x: 515, y: 425, r: 7, label: "Fintech", color: "#f97316" },
  { id: "devtools", x: 635, y: 422, r: 7, label: "Dev Tools", color: "#f97316" },
]

const graphEdges: [string, string][] = [
  // Alex → companies
  ["alex", "stripe"], ["alex", "figma"], ["alex", "plaid"],
  // Alex → skills
  ["alex", "react"], ["alex", "ts"], ["alex", "graphql"], ["alex", "dessys"],
  // Alex → education
  ["alex", "stanford"],
  // Alex → industries
  ["alex", "fintech"], ["alex", "devtools"],
  // Company → role
  ["stripe", "staffeng"], ["stripe", "techlead"], ["figma", "srfront"],
  // Skill → project
  ["react", "destok"], ["react", "payments"], ["ts", "apigw"], ["ts", "payments"],
  ["dessys", "destok"],
  // Role → skill cross-links
  ["staffeng", "react"], ["staffeng", "ts"],
  ["srfront", "react"], ["srfront", "dessys"],
  ["techlead", "graphql"],
  // Industry cross-links
  ["fintech", "stripe"], ["fintech", "plaid"],
]

const nodeMap = new Map(graphNodes.map((n) => [n.id, n]))

// -- Pipeline pills ----------------------------------------------------------

const pills = [
  { label: "Discovered 5", w: 72, bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  { label: "Saved 3", w: 42, bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb" },
  { label: "Applied 2", w: 50, bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)", text: "#059669" },
  { label: "Interviewing 1", w: 76, bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "#7c3aed" },
  { label: "Offer 0", w: 40, bg: "#F0F5F2", border: "rgba(0,0,0,0.06)", text: "#a8a29e" },
]

// -- Component ---------------------------------------------------------------

interface CareerHubIllustrationProps {
  className?: string
}

export function CareerHubIllustration({
  className = "",
}: CareerHubIllustrationProps) {
  // Compute pill x positions
  let pillX = PROFILE.x + 24
  const pillPositions = pills.map((p) => {
    const x = pillX
    pillX += p.w + 14
    return x
  })

  return (
    <svg
      viewBox="0 0 960 632"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TalentClaw Career Hub dashboard"
    >
      <defs>
        <filter id="card-shadow" x="-2%" y="-2%" width="104%" height="108%">
          <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000" floodOpacity="0.04" />
        </filter>
        <filter id="window-shadow" x="-2%" y="-2%" width="104%" height="108%">
          <feDropShadow dx="0" dy="4" stdDeviation="16" floodColor="#059669" floodOpacity="0.06" />
        </filter>
        <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ================================================================== */}
      {/* WINDOW FRAME                                                       */}
      {/* ================================================================== */}
      <rect x="0" y="0" width="960" height="632" rx="12" fill="#FAFDFB" filter="url(#window-shadow)" />
      <rect x="0" y="0" width="960" height="632" rx="12" fill="none" stroke="#ddd9d6" strokeWidth="0.75" />

      {/* Title bar */}
      <rect x="0" y="0" width="960" height="34" rx="12" fill="#F0F0EE" />
      <rect x="0" y="18" width="960" height="16" fill="#F0F0EE" />
      <line x1="0" y1="34" x2="960" y2="34" stroke="#ddd9d6" strokeWidth="0.5" />
      {/* Traffic lights */}
      <circle cx="20" cy="17" r="5" fill="#fc5753" />
      <circle cx="38" cy="17" r="5" fill="#fdbc40" />
      <circle cx="56" cy="17" r="5" fill="#33c748" />

      {/* ================================================================== */}
      {/* SIDEBAR                                                            */}
      {/* ================================================================== */}
      <rect x="0" y="34" width={SIDEBAR_W} height="598" fill="#F5F7F6" />
      <rect x="0" y="616" width="12" height="16" rx="12" fill="#F5F7F6" />
      <line x1={SIDEBAR_W} y1="34" x2={SIDEBAR_W} y2="632" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />

      {/* Brand bar */}
      <line x1="0" y1="90" x2={SIDEBAR_W} y2="90" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
      {/* Crab logo */}
      <g transform="translate(18,49) scale(0.27)">
        <line x1="26" y1="56" x2="20" y2="74" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="38" y1="58" x2="34" y2="76" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="58" x2="54" y2="76" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="62" y1="56" x2="68" y2="74" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="10" y1="30" x2="2" y2="22" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="78" y1="30" x2="86" y2="22" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="2" y1="22" x2="0" y2="14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="2" y1="22" x2="8" y2="16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="86" y1="22" x2="88" y2="14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="86" y1="22" x2="80" y2="16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="10" y="14" width="68" height="46" rx="23" fill="#059669" />
        <rect x="28" y="26" width="10" height="9" rx="3" fill="white" />
        <rect x="50" y="26" width="10" height="9" rx="3" fill="white" />
        <rect x="30" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
        <rect x="52" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
        <line x1="36" y1="44" x2="52" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      </g>
      <text x="46" y="66" fontFamily={FONT_SANS} fontSize="14" fontWeight="600" fill="#1c1917">
        talentclaw
      </text>

      {/* VIEWS section */}
      <text x="20" y="112" fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill="#a8a29e" letterSpacing="0.08em">
        VIEWS
      </text>

      {/* Career Hub — active */}
      <rect x="12" y="122" width="154" height="32" rx="8" fill="rgba(5,150,105,0.08)" />
      <line x1="12" y1="126" x2="12" y2="150" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <g transform="translate(24,131)">
        <path d="M7 1L13 6.5V13H8.5V9H5.5V13H1V6.5L7 1Z" stroke="#059669" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </g>
      <text x="44" y="142" fontFamily={FONT_SANS} fontSize="13" fontWeight="500" fill="#059669">
        Career Hub
      </text>

      {/* Jobs */}
      <g transform="translate(24,163)">
        <rect x="1" y="5" width="12" height="7" rx="1.5" stroke="#57534e" strokeWidth="1.2" fill="none" />
        <path d="M4 5V3.5C4 2.7 4.7 2 5.5 2H8.5C9.3 2 10 2.7 10 3.5V5" stroke="#57534e" strokeWidth="1.2" fill="none" />
      </g>
      <text x="44" y="176" fontFamily={FONT_SANS} fontSize="13" fill="#57534e">
        Jobs
      </text>
      <rect x="130" y="168" width="26" height="18" rx="9" fill="#F0F5F2" />
      <text x="143" y="180" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e" textAnchor="middle">
        12
      </text>

      {/* Pipeline */}
      <g transform="translate(24,195)">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="#57534e" strokeWidth="1.2" fill="none" />
        <line x1="5" y1="4" x2="5" y2="10" stroke="#57534e" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="4" x2="9" y2="7" stroke="#57534e" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <text x="44" y="208" fontFamily={FONT_SANS} fontSize="13" fill="#57534e">
        Pipeline
      </text>
      <rect x="130" y="200" width="26" height="18" rx="9" fill="#F0F5F2" />
      <text x="143" y="212" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e" textAnchor="middle">
        3
      </text>

      {/* Separator */}
      <line x1="12" y1="232" x2="166" y2="232" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />

      {/* FILES section */}
      <text x="20" y="254" fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill="#a8a29e" letterSpacing="0.08em">
        FILES
      </text>

      {/* File tree */}
      {[
        { name: "profile.md", isDir: false, y: 274 },
        { name: "jobs/", isDir: true, y: 292 },
        { name: "applications/", isDir: true, y: 310 },
        { name: "contacts/", isDir: true, y: 328 },
        { name: "activity.log", isDir: false, y: 346 },
      ].map((f) => (
        <g key={f.name}>
          {f.isDir ? (
            <g transform={`translate(24,${f.y - 5})`}>
              <rect x="0" y="2" width="11" height="8" rx="1" fill="#a8a29e" opacity="0.25" />
              <rect x="0" y="0" width="5" height="3" rx="0.8" fill="#a8a29e" opacity="0.25" />
            </g>
          ) : (
            <g transform={`translate(24,${f.y - 6})`}>
              <rect x="1" y="0" width="9" height="11" rx="1" fill="none" stroke="#a8a29e" strokeWidth="0.8" opacity="0.4" />
              <path d="M7 0L10 3" stroke="#a8a29e" strokeWidth="0.6" opacity="0.3" />
            </g>
          )}
          <text x="40" y={f.y + 1} fontFamily={FONT_MONO} fontSize="10.5" fill="#78716c" opacity="0.7">
            {f.name}
          </text>
        </g>
      ))}

      {/* ================================================================== */}
      {/* MAIN CONTENT — stacked full-width cards                            */}
      {/* ================================================================== */}

      {/* ── Profile Card (full width) ──────────────────────────────────── */}
      <rect
        x={PROFILE.x} y={PROFILE.y} width={PROFILE.w} height={PROFILE.h}
        rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75"
        filter="url(#card-shadow)"
      />

      {/* Greeting */}
      <text x={PROFILE.x + 24} y={PROFILE.y + 30} fontFamily={FONT_SERIF} fontSize="18" fontWeight="700" fill="#1c1917">
        Good morning, Alex
      </text>

      {/* Momentum Ring (top-right, inset so labels stay inside card) */}
      <g transform={`translate(${CR - 120},${PROFILE.y + 16})`}>
        {/* Track */}
        <circle cx="16" cy="16" r="14" fill="none" strokeWidth="2.5" stroke="#f0f5f2" />
        {/* Progress arc — 72% */}
        <circle
          cx="16" cy="16" r="14" fill="none" strokeWidth="2.5" stroke="#059669"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 14}`}
          strokeDashoffset={`${2 * Math.PI * 14 * (1 - 0.72)}`}
          transform="rotate(-90 16 16)"
        />
        {/* Score */}
        <text x="16" y="19" fontFamily={FONT_SANS} fontSize="9" fontWeight="600" fill="#1c1917" textAnchor="middle">
          72
        </text>
        {/* Labels */}
        <text x="38" y="13" fontFamily={FONT_SANS} fontSize="9" fontWeight="600" fill="#059669">
          {"↑"}
        </text>
        <text x="46" y="13" fontFamily={FONT_SANS} fontSize="8" fill="#a8a29e">
          Momentum
        </text>
        <text x="38" y="24" fontFamily={FONT_SANS} fontSize="8" fill="#a8a29e">
          Active week
        </text>
      </g>

      {/* Headline */}
      <text x={PROFILE.x + 24} y={PROFILE.y + 50} fontFamily={FONT_SANS} fontSize="12" fill="#57534e">
        Senior Software Engineer · Building developer tools
      </text>

      {/* Pipeline funnel pills */}
      {pills.map((p, i) => {
        const px = pillPositions[i]
        const py = PROFILE.y + 68
        return (
          <g key={p.label}>
            {i > 0 && (
              <text
                x={px - 9} y={py + 14}
                fontFamily={FONT_SANS} fontSize="9" fill="#a8a29e" opacity="0.4" textAnchor="middle"
              >
                →
              </text>
            )}
            <rect x={px} y={py} width={p.w} height="22" rx="11" fill={p.bg} stroke={p.border} strokeWidth="0.5" />
            <text
              x={px + p.w / 2} y={py + 14}
              fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill={p.text} textAnchor="middle"
            >
              {p.label}
            </text>
          </g>
        )
      })}

      {/* ── Separator ──────────────────────────────────────────────────── */}
      <line
        x1={PROFILE.x + 24} y1={PROFILE.y + 102}
        x2={CR - 24} y2={PROFILE.y + 102}
        stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"
      />

      {/* ── Briefing stats row ─────────────────────────────────────────── */}

      {/* ↑ new jobs */}
      <g transform={`translate(${PROFILE.x + 24},${PROFILE.y + 114})`}>
        <path d="M5 9L7.5 3L10 9" stroke="#059669" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="16" y="9" fontFamily={FONT_SANS} fontSize="12" fontWeight="600" fill="#1c1917">3</text>
        <text x="27" y="9" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">new jobs</text>
      </g>

      {/* Bot / agent actions */}
      <g transform={`translate(${PROFILE.x + 114},${PROFILE.y + 114})`}>
        <rect x="1" y="1" width="10" height="8" rx="2" stroke="#8b5cf6" strokeWidth="1" fill="none" />
        <circle cx="4.5" cy="5" r="1" fill="#8b5cf6" />
        <circle cx="8.5" cy="5" r="1" fill="#8b5cf6" />
        <text x="16" y="9" fontFamily={FONT_SANS} fontSize="12" fontWeight="600" fill="#1c1917">2</text>
        <text x="27" y="9" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">agent actions</text>
      </g>

      {/* Profile completeness bar */}
      <g transform={`translate(${PROFILE.x + 240},${PROFILE.y + 114})`}>
        <rect x="0" y="3" width="60" height="5" rx="2.5" fill="#f0f5f2" />
        <rect x="0" y="3" width="43" height="5" rx="2.5" fill="#059669" />
        <text x="68" y="9" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">Profile 72%</text>
      </g>

      {/* ── Compact upcoming actions ───────────────────────────────────── */}
      <g transform={`translate(${PROFILE.x + 24},${PROFILE.y + 140})`}>
        {/* Action 1 */}
        <rect x="0" y="0" width="9" height="9" rx="1.5" stroke="#a8a29e" strokeWidth="0.8" fill="none" />
        <line x1="0" y1="3" x2="9" y2="3" stroke="#a8a29e" strokeWidth="0.6" />
        <text x="13" y="8" fontFamily={FONT_SANS} fontSize="10" fill="#57534e">Follow up on application</text>
        <text x="144" y="8" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">Mar 14</text>

        {/* Action 2 */}
        <rect x="198" y="0" width="9" height="9" rx="1.5" stroke="#a8a29e" strokeWidth="0.8" fill="none" />
        <line x1="198" y1="3" x2="207" y2="3" stroke="#a8a29e" strokeWidth="0.6" />
        <text x="211" y="8" fontFamily={FONT_SANS} fontSize="10" fill="#57534e">Submit coding challenge</text>
        <text x="342" y="8" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">Mar 18</text>
      </g>

      {/* ── Agent insights separator ───────────────────────────────────── */}
      <line
        x1={PROFILE.x + 24} y1={PROFILE.y + 160}
        x2={CR - 24} y2={PROFILE.y + 160}
        stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"
      />

      {/* ── "What your agent learned" ──────────────────────────────────── */}
      <g transform={`translate(${PROFILE.x + 24},${PROFILE.y + 170})`}>
        {/* Lightbulb icon */}
        <circle cx="4" cy="3.5" r="3.5" fill="rgba(245,158,11,0.12)" />
        <circle cx="4" cy="2.5" r="2" stroke="#f59e0b" strokeWidth="0.8" fill="none" />
        <line x1="4" y1="5" x2="4" y2="6.5" stroke="#f59e0b" strokeWidth="0.7" />
        <text x="12" y="6" fontFamily={FONT_SANS} fontSize="8" fontWeight="500" fill="#a8a29e" letterSpacing="0.06em">
          WHAT YOUR AGENT LEARNED
        </text>
        <text x="0" y="18" fontFamily={FONT_SANS} fontSize="10" fill="#57534e">
          38% of your applications have progressed to interviews. Companies that responded well: Stripe, Figma.
        </text>
      </g>

      {/* ================================================================== */}
      {/* CAREER CONTEXT GRAPH (full width)                                  */}
      {/* ================================================================== */}
      <rect
        x={GRAPH.x} y={GRAPH.y} width={GRAPH.w} height={GRAPH.h}
        rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75"
        filter="url(#card-shadow)"
      />

      {/* Graph edges */}
      {graphEdges.map(([srcId, tgtId], i) => {
        const s = nodeMap.get(srcId)
        const t = nodeMap.get(tgtId)
        if (!s || !t) return null
        return (
          <line
            key={i}
            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="rgba(0,0,0,0.07)" strokeWidth="0.8"
          />
        )
      })}

      {/* Graph nodes + labels */}
      {graphNodes.map((n) => {
        const isPerson = n.id === "alex"
        return (
          <g key={n.id}>
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill={n.color} opacity="0.85"
              filter={isPerson ? "url(#node-glow)" : undefined}
            />
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill="none" stroke={n.color} strokeWidth="0.5" opacity="0.25"
            />
            {isPerson && (
              <circle cx={n.x} cy={n.y} r={4.5} fill="white" opacity="0.9" />
            )}
            <text
              x={n.x} y={n.y + n.r + 11}
              fontFamily={FONT_SANS}
              fontSize={isPerson ? "10" : "9"}
              fontWeight={isPerson ? "600" : "400"}
              fill="rgba(28,25,23,0.6)" textAnchor="middle"
            >
              {n.label}
            </text>
          </g>
        )
      })}

      {/* Zoom controls (bottom-right of graph card) */}
      {[
        { label: "+", dy: -54 },
        { label: "\u2212", dy: -38 },
        { label: "\u21B4", dy: -22 },
      ].map((btn, i) => (
        <g key={i}>
          <rect
            x={CR - 34} y={GRAPH.y + GRAPH.h + btn.dy}
            width="20" height="14" rx="3"
            fill="white" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5"
          />
          <text
            x={CR - 24} y={GRAPH.y + GRAPH.h + btn.dy + 10.5}
            fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e" textAnchor="middle"
          >
            {btn.label}
          </text>
        </g>
      ))}

      {/* ================================================================== */}
      {/* BOTTOM ROW — Activity Feed (left) + Upcoming Actions (right)       */}
      {/* ================================================================== */}

      {/* ── Activity Feed ──────────────────────────────────────────────── */}
      <rect
        x={FEED.x} y={FEED.y} width={FEED.w} height={FEED.h}
        rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75"
        filter="url(#card-shadow)"
      />

      <text x={FEED.x + 20} y={FEED.y + 24} fontFamily={FONT_SANS} fontSize="12" fontWeight="600" fill="#1c1917">
        Recent Activity
      </text>
      <text x={FEED.x + 120} y={FEED.y + 24} fontFamily={FONT_MONO} fontSize="8" fill="#a8a29e" opacity="0.6">
        activity.log
      </text>

      {/* Activity entries (compact — 3 shown) */}
      {[
        { iconBg: "rgba(5,150,105,0.08)", iconColor: "#059669", iconType: "search", title: "Discovered 3 new matches", slug: "jobs/", time: "2h ago" },
        { iconBg: "rgba(139,92,246,0.1)", iconColor: "#8b5cf6", iconType: "send", title: "Applied to Staff Engineer", slug: "stripe-staff-engineer", time: "5h ago" },
        { iconBg: "rgba(16,185,129,0.1)", iconColor: "#10b981", iconType: "message", title: "Message from Figma", slug: "messages/figma-recruiter", time: "Yesterday" },
      ].map((entry, i) => {
        const ey = FEED.y + 38 + i * 26
        const feedRight = FEED.x + FEED.w - 20
        return (
          <g key={i}>
            {i > 0 && (
              <line x1={FEED.x + 20} y1={ey - 5} x2={feedRight} y2={ey - 5} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
            )}
            {/* Icon square */}
            <rect x={FEED.x + 20} y={ey} width={20} height={20} rx={5} fill={entry.iconBg} />
            {/* Mini icon */}
            <g transform={`translate(${FEED.x + 25},${ey + 5})`}>
              {entry.iconType === "search" && (
                <>
                  <circle cx="4" cy="4" r="3" stroke={entry.iconColor} strokeWidth="1.1" fill="none" />
                  <line x1="6.2" y1="6.2" x2="9" y2="9" stroke={entry.iconColor} strokeWidth="1.1" strokeLinecap="round" />
                </>
              )}
              {entry.iconType === "send" && (
                <path d="M1 9L9 5L1 1L2.5 5L1 9Z" stroke={entry.iconColor} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
              )}
              {entry.iconType === "message" && (
                <>
                  <rect x="0.5" y="0.5" width="9" height="7" rx="1.5" stroke={entry.iconColor} strokeWidth="1" fill="none" />
                  <path d="M2.5 7L1 9.5L4 7" fill={entry.iconColor} opacity="0.6" />
                </>
              )}
            </g>
            {/* Title */}
            <text x={FEED.x + 46} y={ey + 9} fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill="#1c1917">
              {entry.title}
            </text>
            {/* Slug */}
            <text x={FEED.x + 46} y={ey + 19} fontFamily={FONT_SANS} fontSize="8.5" fill="#a8a29e">
              {entry.slug}
            </text>
            {/* Time */}
            <text x={feedRight} y={ey + 9} fontFamily={FONT_SANS} fontSize="8.5" fill="#a8a29e" textAnchor="end">
              {entry.time}
            </text>
          </g>
        )
      })}

      {/* Footer */}
      <line
        x1={FEED.x + 20} y1={FEED.y + FEED.h - 22}
        x2={FEED.x + FEED.w - 20} y2={FEED.y + FEED.h - 22}
        stroke="rgba(0,0,0,0.04)" strokeWidth="0.5"
      />
      <text x={FEED.x + 20} y={FEED.y + FEED.h - 8} fontFamily={FONT_SANS} fontSize="9" fill="#a8a29e">
        Showing last 5 entries
      </text>

      {/* ── Upcoming Actions ───────────────────────────────────────────── */}
      <rect
        x={ACTIONS.x} y={ACTIONS.y} width={ACTIONS.w} height={ACTIONS.h}
        rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75"
        filter="url(#card-shadow)"
      />

      <text x={ACTIONS.x + 20} y={ACTIONS.y + 24} fontFamily={FONT_SANS} fontSize="12" fontWeight="600" fill="#1c1917">
        Upcoming Actions
      </text>

      {/* Action items */}
      {[
        { dot: "#d97706", title: "Follow up on application", sub: "Acme Corp · 2026-03-14", urgent: true },
        { dot: "#059669", title: "Submit coding challenge", sub: "Figma · 2026-03-18", urgent: false },
        { dot: "#059669", title: "Prepare for interview", sub: "Linear · 2026-03-22", urgent: false },
      ].map((action, i) => {
        const ay = ACTIONS.y + 46 + i * 30
        return (
          <g key={i}>
            <circle cx={ACTIONS.x + 24} cy={ay + 5} r={3} fill={action.dot} />
            <text x={ACTIONS.x + 34} y={ay + 4} fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill="#1c1917">
              {action.title}
            </text>
            <text x={ACTIONS.x + 34} y={ay + 16} fontFamily={FONT_SANS} fontSize="9" fill="#a8a29e">
              {action.sub}
              {action.urgent && (
                <tspan fill="#dc2626" fontWeight="500"> Overdue</tspan>
              )}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
