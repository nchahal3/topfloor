import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import type { Tier } from "@/lib/tier";
import { PRICE_TIER, TIER_LABELS } from "@/lib/tier";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

const TIER_PRICE: Partial<Record<string, string>> = Object.fromEntries(
  Object.entries(PRICE_TIER)
    .filter(([, t]) => t !== "lifetime")
    .map(([priceId, t]) => [t, priceId])
);

const TIER_AMOUNT: Partial<Record<string, string>> = {
  bronze: "$200/mo",
  silver: "$500/mo",
  gold: "$750/mo",
  lifetime: "$2,000 (one-time)",
};

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
    const client = await clerkClient();

    // Get member info before updating
    const user = await client.users.getUser(clerkUserId);
    const memberEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const memberName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Member";

    // Update Clerk tier immediately
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { tier: tier ?? null },
    });

    // Update Stripe subscription and get next billing date
    let nextBillingDate = "your next billing date";
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
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end ?? sub.items.data[0]?.current_period_end;
          if (periodEnd) {
            nextBillingDate = new Date(periodEnd * 1000).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            });
          }
        } catch (stripeErr) {
          console.error("Stripe subscription update failed:", stripeErr);
        }
      }
    }

    // Send emails if tier is being set (not removed)
    if (tier && memberEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const tierLabel = TIER_LABELS[tier] ?? tier;
        const amount = TIER_AMOUNT[tier] ?? "";
        const FROM = "noreply@topfloortradesofficial.com";

        await Promise.all([
          // Email to member
          resend.emails.send({
            from: FROM,
            to: memberEmail,
            subject: `You've been upgraded to ${tierLabel} — TopFloor`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
                <h2 style="color:#00ff88;margin-top:0;">You've Been Upgraded 🎉</h2>
                <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, your TopFloor membership has been upgraded to <strong style="color:#f0c040;">${tierLabel}</strong>.</p>
                <p style="color:#aaa;line-height:1.6;">Your new access is active right now. ${tier !== "lifetime" ? `You will be billed <strong style="color:#f5f5f5;">${amount}</strong> starting <strong style="color:#f5f5f5;">${nextBillingDate}</strong>.` : "You now have lifetime access — no further charges."}</p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
                    Go to My Dashboard →
                  </a>
                </div>
                <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
                <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results.</p>
              </div>
            `,
          }),
          // Email to coach
          resend.emails.send({
            from: FROM,
            to: process.env.COACH_EMAIL!,
            subject: `⬆️ Member Upgraded — ${memberName} → ${tierLabel}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
                <h2 style="color:#00ff88;margin-top:0;">Member Tier Updated</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
                  <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#999;">New Tier</td><td style="padding:8px 0;color:#f0c040;font-weight:bold;">${tierLabel} (${amount})</td></tr>
                  ${tier !== "lifetime" ? `<tr><td style="padding:8px 0;color:#999;">Next Bill</td><td style="padding:8px 0;">${nextBillingDate}</td></tr>` : ""}
                </table>
              </div>
            `,
          }),
        ]);
      } catch (emailErr) {
        console.error("Failed to send upgrade emails:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update tier:", err);
    return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
  }
}
