import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { Tier } from "@/lib/tier";
import { PRICE_TIER } from "@/lib/tier";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

// Reverse map: tier → price ID (recurring tiers only)
const TIER_PRICE: Partial<Record<string, string>> = Object.fromEntries(
  Object.entries(PRICE_TIER)
    .filter(([, t]) => t !== "lifetime")
    .map(([priceId, t]) => [t, priceId])
);

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clerkUserId, tier, subscriptionId } = await request.json() as {
    clerkUserId: string;
    tier: Tier;
    subscriptionId: string | null;
  };

  if (!clerkUserId) {
    return NextResponse.json({ error: "clerkUserId required" }, { status: 400 });
  }

  try {
    // Update Clerk tier immediately
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { tier: tier ?? null },
    });

    // If they have an active subscription and new tier has a recurring price, update Stripe
    if (subscriptionId && tier && tier !== "lifetime") {
      const newPriceId = TIER_PRICE[tier];
      if (newPriceId) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const itemId = sub.items.data[0]?.id;
          if (itemId) {
            await stripe.subscriptions.update(subscriptionId, {
              items: [{ id: itemId, price: newPriceId }],
              proration_behavior: "none",
            });
          }
        } catch (stripeErr) {
          console.error("Stripe subscription update failed:", stripeErr);
          // Clerk was already updated — don't fail the whole request
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update tier:", err);
    return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
  }
}
