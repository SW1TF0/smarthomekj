import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { cancelUnpaidOrder, markOrderPaid } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";

// Configure in Stripe → Developers → Webhooks: events checkout.session.completed,
// checkout.session.async_payment_succeeded and checkout.session.expired.
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  if (orderId) {
    if (
      (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await markOrderPaid(orderId);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await cancelUnpaidOrder(orderId);
    }
  }
  return NextResponse.json({ received: true });
}
