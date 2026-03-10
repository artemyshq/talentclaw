import { NextRequest, NextResponse } from "next/server"
import { getStripe, getPriceId } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, current_role, target_roles, location, remote_preference } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: getPriceId(), quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_name: name,
          user_email: email,
        },
      },
      metadata: {
        user_name: name,
        user_email: email,
        current_role: current_role || "",
        target_roles: target_roles || "",
        location: location || "",
        remote_preference: remote_preference || "",
      },
      success_url: `${req.nextUrl.origin}/dashboard`,
      cancel_url: `${req.nextUrl.origin}/#pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 },
    )
  }
}
