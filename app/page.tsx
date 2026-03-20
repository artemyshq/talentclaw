import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Hero } from "@/components/landing/hero"
import { HubShowcase } from "@/components/landing/hub-showcase"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
export default async function RootPage() {
  const host = (await headers()).get("host") || ""
  if (host.includes(":3100")) {
    redirect("/dashboard")
  }

  return (
    <>
      <Hero />
      <HubShowcase />
      <Features />
      <Footer />
    </>
  )
}
