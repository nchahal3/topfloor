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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const client = await clerkClient();
    const FROM = "noreply@topfloortradesofficial.com";
    const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://topfloortradesofficial.com";

    const user = await client.users.getUser(clerkUserId);
    const memberEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const memberName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Member";

    const tierLabel = tier ? (TIER_LABELS[tier] ?? tier) : "No Access";
    const amount = tier ? (TIER_AMOUNT[tier] ?? "") : "";

    // --- Monthly → Lifetime: cancel sub, remove access, send payment link ---
    // Access is restored automatically when webhook fires after they pay $2,000
    if (tier === "lifetime" && subscriptionId) {
      // Remove access, flag as pending lifetime payment
      await client.users.updateUserMetadata(clerkUserId, {
        publicMetadata: { tier: null, pendingLifetime: true },
      });
      try {
        await stripe.subscriptions.cancel(subscriptionId);
      } catch (err) {
        console.error("Failed to cancel subscription for lifetime upgrade:", err);
      }

      if (memberEmail) {
        await Promise.all([
          resend.emails.send({
            from: FROM,
            to: memberEmail,
            subject: "You've been moved to Lifetime — complete your payment",
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
                <h2 style="color:#00ff88;margin-top:0;">Lifetime Access Incoming 🔐</h2>
                <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, your monthly subscription has been cancelled and you've been moved to a <strong style="color:#f0c040;">Lifetime</strong> membership.</p>
                <p style="color:#aaa;line-height:1.6;">Your access is active right now. Please complete the one-time <strong style="color:#f5f5f5;">$2,000 lifetime payment</strong> to lock in your access permanently.</p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${BASE_URL}/api/checkout/lifetime" style="display:inline-block;background:#f0c040;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
                    Complete Lifetime Payment →
                  </a>
                </div>
                <p style="color:#555;font-size:13px;text-align:center;">If you have any questions, reply to this email or contact us at topfloor@topfloortradesofficial.com</p>
                <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
                <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results.</p>
              </div>
            `,
          }),
          resend.emails.send({
            from: FROM,
            to: process.env.COACH_EMAIL!,
            subject: `♾️ Member Moved to Lifetime — ${memberName}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
                <h2 style="color:#f0c040;margin-top:0;">Monthly → Lifetime Upgrade</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
                  <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#999;">Action</td><td style="padding:8px 0;">Monthly sub cancelled, lifetime access granted</td></tr>
                  <tr><td style="padding:8px 0;color:#999;">Awaiting</td><td style="padding:8px 0;color:#f0c040;font-weight:bold;">$2,000 lifetime payment</td></tr>
                </table>
              </div>
            `,
          }),
        ]).catch((e) => console.error("Email failed:", e));
      }

      return NextResponse.json({ success: true });
    }

    // --- Regular tier change (Bronze/Silver/Gold, remove access, or lifetime with no existing sub) ---
    // Update Clerk tier — only for non-lifetime-from-subscription cases
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { tier: tier ?? null, pendingLifetime: false },
    });
    let nextBillingDate = "your next billing date";
    if (subscriptionId && tier && tier !== "lifetime") {
      const newPriceId = TIER_PRICE[tier];
      if (newPriceId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const itemId = sub.items.data[0]?.id;
          if (itemId) {
            await stripe.subscriptions.update(subscriptionId, {
              items: [{ id: itemId, price: newPriceId }],
              proration_behavior: "none",
            });
          }
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
            ?? sub.items.data[0]?.current_period_end;
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

    if (tier && memberEmail) {
      await Promise.all([
        resend.emails.send({
          from: FROM,
          to: memberEmail,
          subject: `You've been upgraded to ${tierLabel} — TopFloor`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
              <h2 style="color:#00ff88;margin-top:0;">You've Been Upgraded 🎉</h2>
              <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, your TopFloor membership has been upgraded to <strong style="color:#f0c040;">${tierLabel}</strong>.</p>
              <p style="color:#aaa;line-height:1.6;">Your new access is active right now. You will be billed <strong style="color:#f5f5f5;">${amount}</strong> starting <strong style="color:#f5f5f5;">${nextBillingDate}</strong>.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
                  Go to My Dashboard →
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
              <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results.</p>
            </div>
          `,
        }),
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
                <tr><td style="padding:8px 0;color:#999;">Next Bill</td><td style="padding:8px 0;">${nextBillingDate}</td></tr>
              </table>
            </div>
          `,
        }),
      ]).catch((e) => console.error("Email failed:", e));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update tier:", err);
    return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
  }
}
