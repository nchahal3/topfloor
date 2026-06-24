import Stripe from "stripe";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Tier } from "@/lib/tier";
import { PRICE_TIER } from "@/lib/tier";

const PRICE_IDS: Record<string, string> = {
  bronze: process.env.STRIPE_PRICE_BRONZE ?? "price_1TiphA8U0Yle7MZgUELrqhSV",
  silver: process.env.STRIPE_PRICE_SILVER ?? "price_1TiphA8U0Yle7MZggKFKtsl8",
  gold: process.env.STRIPE_PRICE_GOLD ?? "price_1TiphA8U0Yle7MZgkmDxN3lZ",
  lifetime: process.env.STRIPE_PRICE_LIFETIME ?? "price_1TiphC8U0Yle7MZg1ivchT6j",
};

const RECURRING = new Set(["bronze", "silver", "gold"]);

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

    // If upgrading/downgrading an existing subscription, update it in place
    if (isRecurring && customerId) {
      const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (activeSubs.data.length > 0) {
        const sub = activeSubs.data[0];
        const currentPriceId = sub.items.data[0]?.price?.id;
        if (currentPriceId !== priceId) {
          await stripe.subscriptions.update(sub.id, {
            items: [{ id: sub.items.data[0].id, price: priceId }],
            proration_behavior: "always_invoice",
            metadata: userId ? { clerkUserId: userId } : {},
          });
          // Update Clerk tier immediately since no checkout.session.completed fires
          if (userId) {
            const clerk = await clerkClient();
            await clerk.users.updateUserMetadata(userId, {
              publicMetadata: { tier: plan as Tier },
            });
          }
        }
        return NextResponse.json({ url: `${baseUrl}/success?plan=${plan}` });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: isRecurring ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : {}),
      // Store clerkUserId on the subscription itself so cancellation webhooks can find the user
      ...(isRecurring && userId ? { subscription_data: { metadata: { clerkUserId: userId } } } : {}),
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
