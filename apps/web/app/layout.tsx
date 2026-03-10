import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "TalentClaw - Your AI Career Agent",
  description:
    "A local-first career CRM powered by AI. Discover jobs, manage your pipeline, and let your agent handle the search.",
  openGraph: {
    title: "TalentClaw - Your AI Career Agent",
    description:
      "A local-first career CRM powered by AI. Discover jobs, manage your pipeline, and let your agent handle the search.",
    siteName: "TalentClaw",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
