import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentSucceeded(invoice)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentFailed(invoice)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}

  console.log("=== NEW TALENTCLAW SIGNUP ===")
  console.log("Name:", metadata.user_name)
  console.log("Email:", metadata.user_email)
  console.log("Current role:", metadata.current_role)
  console.log("Target roles:", metadata.target_roles)
  console.log("Location:", metadata.location)
  console.log("Remote:", metadata.remote_preference)
  console.log("Stripe Customer:", session.customer)
  console.log("Stripe Subscription:", session.subscription)
  console.log("============================")

  // TODO: Provision user's local TalentClaw instance
  // 1. Create user record
  // 2. Initialize DuckDB with schema
  // 3. Register agent with Coffee Shop
  // 4. Send welcome email
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Payment succeeded for subscription:", invoice.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Payment failed for subscription:", invoice.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription cancelled:", subscription.id)
}
