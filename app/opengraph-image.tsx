import { ImageResponse } from "next/og"

export const alt = "talentclaw - Your AI Career Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const crabSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 80" width="176" height="160">
  <path d="M26 56 L20 74" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M38 58 L34 76" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M50 58 L54 76" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M62 56 L68 74" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M10 30 L2 22" stroke="#059669" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M78 30 L86 22" stroke="#059669" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M2 22 L0 14" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M2 22 L8 16" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M86 22 L88 14" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M86 22 L80 16" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <rect x="10" y="14" width="68" height="46" rx="23" fill="#059669"/>
  <rect x="28" y="26" width="10" height="9" rx="3" fill="white"/>
  <rect x="50" y="26" width="10" height="9" rx="3" fill="white"/>
  <rect x="30" y="27" width="7" height="7" rx="2" fill="#1a1a2e"/>
  <rect x="52" y="27" width="7" height="7" rx="2" fill="#1a1a2e"/>
  <path d="M36 44 L52 44" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.85" fill="none"/>
</svg>`

const crabDataUri = `data:image/svg+xml;base64,${Buffer.from(crabSvg).toString("base64")}`

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={crabDataUri} width={176} height={160} alt="" />

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
