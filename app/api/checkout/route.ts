import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PRICE_IDS: Record<string, string> = {
  bronze: "price_1TRIBdRxClGX2uTFE404PcWF",       // $200/mo Bronze
  foundation: "price_1TPYX3RxClGX2uTFzwnMHkP2",  // $500/mo (Silver)
  elite_monthly: "price_1TPYXsRxClGX2uTFcMCkSlMo", // $750/mo (Gold)
  elite_lifetime: "price_1TPYYGRxClGX2uTF7o1v901o", // $2,000 Lifetime
};

const RECURRING = new Set(["bronze", "foundation", "elite_monthly"]);

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { userId } = await auth();

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
      phone_number_collection: { enabled: true },
      custom_fields: [
        {
          key: "discord_username",
          label: { type: "custom", custom: "Discord Username" },
          type: "text",
          optional: false,
        },
      ],
      // Pass Clerk userId so webhook can update tier automatically
      metadata: userId ? { clerkUserId: userId } : {},
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
