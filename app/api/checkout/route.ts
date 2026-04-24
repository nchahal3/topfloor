import Stripe from "stripe";
import { NextResponse } from "next/server";

const PRICE_IDS: Record<string, string> = {
  foundation: "price_1TPYX3RxClGX2uTFzwnMHkP2",
  elite_monthly: "price_1TPYXsRxClGX2uTFcMCkSlMo",
  elite_lifetime: "price_1TPYYGRxClGX2uTF7o1v901o",
};

const RECURRING = new Set(["foundation", "elite_monthly"]);

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { plan } = await request.json() as { plan: string };
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    const isRecurring = RECURRING.has(plan);

    const session = await stripe.checkout.sessions.create({
      mode: isRecurring ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?plan=${plan}`,
      cancel_url: `${baseUrl}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
