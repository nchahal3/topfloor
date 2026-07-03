import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PRICE_TIER } from "@/lib/tier";

const lifetimePriceId = Object.entries(PRICE_TIER).find(([, t]) => t === "lifetime")?.[0];

export async function GET() {
  const base = process.env.NEXT_PUBLIC_URL ?? "https://topfloortradesofficial.com";

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(`${base}/sign-in`);
  }

  if (!lifetimePriceId) {
    console.error("Lifetime price ID not found in PRICE_TIER map");
    return NextResponse.redirect(`${base}/pricing?error=config`);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  let customerId: string | undefined;
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) customerId = existing.data[0].id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: lifetimePriceId, quantity: 1 }],
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    success_url: `${base}/success?plan=lifetime`,
    cancel_url: `${base}/dashboard`,
    allow_promotion_codes: true,
    metadata: { clerkUserId: userId },
  });

  return NextResponse.redirect(session.url!);
}
