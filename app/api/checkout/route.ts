import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PRICE_IDS: Record<string, string> = {
  bronze: "price_1TcXNFLzOgqHnoj8K3UFHzkb",
  foundation: "price_1TcXPLLzOgqHnoj8SssRgzrw",
  elite_monthly: "price_1TcXPvLzOgqHnoj8CddbTIjW",
  elite_lifetime: "price_1TcXQfLzOgqHnoj8KnOfBONZ",
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

    // Look up existing Stripe customer by email to avoid duplicates
    let customerId: string | undefined;
    if (userId) {
      const user = await currentUser();
      const email = user?.emailAddresses[0]?.emailAddress;
      if (email) {
        const existing = await stripe.customers.list({ email, limit: 1 });
        if (existing.data.length > 0) {
          customerId = existing.data[0].id;
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: isRecurring ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : {}),
      success_url: `${baseUrl}/success?plan=${plan}`,
      cancel_url: `${baseUrl}/pricing`,
      phone_number_collection: { enabled: true },
      custom_fields: [
        {
          key: "discord_username",
          label: { type: "custom", custom: "Discord Username" },
          type: "text",
          optional: false,
        },
      ],
      metadata: userId ? { clerkUserId: userId } : {},
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
