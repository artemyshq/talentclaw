import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "talentclaw - Your AI Career Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
        }}
      >
        {/* Crab logo as inline SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 88 80"
          width="176"
          height="160"
        >
          {/* Legs */}
          <line
            x1="26" y1="56" x2="20" y2="74"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="38" y1="58" x2="34" y2="76"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="50" y1="58" x2="54" y2="76"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="62" y1="56" x2="68" y2="74"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Arms */}
          <line
            x1="10" y1="30" x2="2" y2="22"
            stroke="#059669" strokeWidth="3.5" strokeLinecap="round"
          />
          <line
            x1="78" y1="30" x2="86" y2="22"
            stroke="#059669" strokeWidth="3.5" strokeLinecap="round"
          />
          {/* Pincers */}
          <line
            x1="2" y1="22" x2="0" y2="14"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="2" y1="22" x2="8" y2="16"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="86" y1="22" x2="88" y2="14"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="86" y1="22" x2="80" y2="16"
            stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Body */}
          <rect x="10" y="14" width="68" height="46" rx="23" fill="#059669" />
          {/* Eyes */}
          <rect x="28" y="26" width="10" height="9" rx="3" fill="white" />
          <rect x="50" y="26" width="10" height="9" rx="3" fill="white" />
          <rect x="30" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
          <rect x="52" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
          {/* Mouth */}
          <line
            x1="36" y1="44" x2="52" y2="44"
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
            opacity="0.85"
          />
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            talentclaw
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a3a3a3",
            }}
          >
            Your AI Career Platform
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "16px",
            padding: "12px 24px",
            background: "#1a1a1a",
            borderRadius: "8px",
            border: "1px solid #333",
          }}
        >
          <div style={{ fontSize: 22, color: "#059669", fontFamily: "monospace" }}>
            $
          </div>
          <div style={{ fontSize: 22, color: "#e5e5e5", fontFamily: "monospace" }}>
            npx talentclaw
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
