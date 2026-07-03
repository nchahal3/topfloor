import Stripe from "stripe";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Tier } from "@/lib/tier";
import { PRICE_TIER } from "@/lib/tier";
import { sendDiscordLog } from "@/lib/discord";
import { grantProRole, revokeProRole } from "@/lib/discord-roles";
import { supabaseAdmin } from "@/lib/supabase";
import { scheduleGraceRevoke } from "@/lib/qstash";

const FROM_EMAIL = "TopFloor <noreply@topfloortradesofficial.com>";
const DISCORD_INVITE = "https://discord.gg/yebuyWPswJ";

const PLAN_NAMES: Record<string, string> = {
  price_1TiphA8U0Yle7MZgUELrqhSV: "Bronze ($200/mo)",
  price_1TiphA8U0Yle7MZggKFKtsl8: "Silver ($500/mo)",
  price_1TiphA8U0Yle7MZgkmDxN3lZ: "Gold ($750/mo)",
  price_1TiphC8U0Yle7MZg1ivchT6j: "Lifetime ($2,000)",
  price_1TiikP8sHKVNeGWtxjodurtl: "Bronze ($200/mo) [test]",
  price_1Tiike8sHKVNeGWtJr1gxDZx: "Silver ($500/mo) [test]",
  price_1Tiiku8sHKVNeGWtthSeTog0: "Gold ($750/mo) [test]",
  price_1Tiil68sHKVNeGWt4SFHY6P5: "Lifetime ($2,000) [test]",
};

// Receipt / payment-confirmation email body. Used for new plan purchases, monthly
// renewals, lifetime one-time payments, and recovery after a failed payment.
// Stripe dahlia API (v22+) removed the top-level invoice.subscription field and moved it to
// invoice.parent.subscription_details.subscription. Read the new location, fall back to the old.
function getInvoiceSubscriptionId(invoice: Stripe.Invoice & { subscription?: string }): string | null {
  const parent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id?: string } } };
  }).parent;
  const fromParent = parent?.subscription_details?.subscription;
  if (typeof fromParent === "string") return fromParent;
  if (fromParent && typeof fromParent === "object" && fromParent.id) return fromParent.id;
  return typeof invoice.subscription === "string" ? invoice.subscription : null;
}

function paymentReceiptHtml(opts: {
  name: string;
  planName: string;
  amount: string;
  currency: string;
  invoiceUrl?: string | null;
  restored?: boolean;
}): string {
  const { name, planName, amount, currency, invoiceUrl, restored } = opts;
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
      <h2 style="color:#00ff88;margin-top:0;">${restored ? "Payment received - you're back in 🔝" : "Payment received ✅"}</h2>
      <p style="color:#aaa;line-height:1.6;">Hey ${name}, ${restored
        ? "your payment went through and your 🔝Floor access has been restored."
        : "thanks for your payment - here's your receipt."}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#999;width:120px;">Plan</td><td style="padding:8px 0;color:#f0c040;font-weight:bold;">${planName}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Amount</td><td style="padding:8px 0;font-weight:bold;">$${amount} ${currency}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Date</td><td style="padding:8px 0;">${dateStr}</td></tr>
      </table>
      ${invoiceUrl ? `<div style="text-align:center;margin:24px 0;"><a href="${invoiceUrl}" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:12px 28px;border-radius:999px;text-decoration:none;">View / Download Invoice →</a></div>` : ""}
      ${restored ? `<p style="color:#aaa;line-height:1.6;">If your Discord Pro role doesn't come back automatically, just reconnect Discord from your dashboard.</p>` : ""}
      <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
      <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results. 🔝Floor provides educational content only.</p>
    </div>`;
}

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const resend = new Resend(process.env.RESEND_API_KEY);

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email ?? "Unknown";
    const customerName = session.customer_details?.name ?? "New Member";

    // If this email was previously deleted by an admin, clear the blocklist so they
    // reappear in the admin list now that they've signed up again.
    if (customerEmail !== "Unknown") {
      await supabaseAdmin.from("deleted_members").delete().eq("email", customerEmail.toLowerCase());
    }
    const customerPhone = session.customer_details?.phone ?? "Not provided";
    const discordUsername =
      session.custom_fields?.find((f) => f.key === "discord_username")?.text?.value ?? "Not provided";

    let planName = "🔝Floor Membership";
    let tier: Tier = null;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id ?? "";
      planName = PLAN_NAMES[priceId] ?? planName;
      tier = PRICE_TIER[priceId] ?? null;
    } catch {}

    const clerkUserId = session.metadata?.clerkUserId;
    let alreadyProcessed = false;
    let clerkFailed = false;
    if (clerkUserId && tier) {
      try {
        const client = await clerkClient();
        const existingUser = await client.users.getUser(clerkUserId);
        const existingTier = existingUser.publicMetadata?.tier;
        if (existingTier === tier) {
          alreadyProcessed = true;
        } else {
          await client.users.updateUserMetadata(clerkUserId, {
            publicMetadata: {
              tier,
              suspendedTier: null,
              gracePeriodEnd: null,
              pendingLifetime: false,
              phone: customerPhone !== "Not provided" ? customerPhone : undefined,
              discordUsername: discordUsername !== "Not provided" ? discordUsername : undefined,
              stripeCustomerId: session.customer as string ?? undefined,
            },
          });
          // Clear grace period index if they were in one
          await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", clerkUserId);
          // Grant Discord Pro role if user has linked their Discord
          const updatedUser = await client.users.getUser(clerkUserId);
          const discordUserId = updatedUser.publicMetadata?.discordUserId as string | undefined;
          await grantProRole(discordUserId);
          // Cancel any active monthly subscription when self-upgrading to lifetime
          if (tier === "lifetime" && session.customer) {
            try {
              const activeSubs = await stripe.subscriptions.list({
                customer: session.customer as string,
                status: "active",
                limit: 10,
              });
              for (const sub of activeSubs.data) {
                await stripe.subscriptions.cancel(sub.id);
              }
            } catch (e) {
              console.error("Failed to cancel monthly sub on lifetime upgrade:", e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to update Clerk user tier:", err);
        clerkFailed = true;
        sendDiscordLog({
          title: "⚠️ URGENT: Access Grant Failed",
          color: 0xff4444,
          fields: [
            { name: "Name", value: customerName, inline: true },
            { name: "Plan", value: planName, inline: true },
            { name: "Email", value: customerEmail, inline: false },
            { name: "Clerk ID", value: clerkUserId ?? "missing", inline: true },
            { name: "Error", value: err instanceof Error ? err.message : String(err), inline: false },
          ],
          description: "Payment received but dashboard access could not be granted. Manual action required.",
        });
        // Alert coach so they can manually fix access
        await resend.emails.send({
          from: FROM_EMAIL,
          to: process.env.COACH_EMAIL!,
          subject: `⚠️ URGENT: Failed to grant dashboard access - ${customerName}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#1a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;border:2px solid #ff4444;">
              <h2 style="color:#ff4444;margin-top:0;">⚠️ Access Grant Failed</h2>
              <p style="color:#aaa;">A payment was received but the member's dashboard access could not be automatically granted. Manual action required.</p>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#999;width:120px;">Name</td><td style="padding:8px 0;font-weight:bold;">${customerName}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${customerEmail}" style="color:#00ff88;">${customerEmail}</a></td></tr>
                <tr><td style="padding:8px 0;color:#999;">Plan</td><td style="padding:8px 0;color:#f0c040;font-weight:bold;">${planName}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Clerk ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${clerkUserId ?? "missing"}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Error</td><td style="padding:8px 0;color:#ff4444;">${err instanceof Error ? err.message : String(err)}</td></tr>
              </table>
              <p style="color:#aaa;margin-top:16px;">Go to the admin panel and manually set their tier to <strong>${tier}</strong>.</p>
            </div>
          `,
        }).catch(() => {});
      }
    }

    // Don't send welcome email if Clerk failed (member has no access yet)
    if (alreadyProcessed || clerkFailed) {
      return NextResponse.json({ received: true });
    }

    sendDiscordLog({
      title: "💰 New Member",
      color: 0x00ff88,
      fields: [
        { name: "Name", value: customerName, inline: true },
        { name: "Plan", value: planName, inline: true },
        { name: "Email", value: customerEmail, inline: false },
        { name: "Phone", value: customerPhone, inline: true },
        { name: "Discord", value: discordUsername, inline: true },
      ],
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.COACH_EMAIL!,
      subject: `💰 New 🔝Floor Member - ${customerName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
          <h2 style="color:#00ff88;margin-top:0;">New Member Just Signed Up 🔥</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${customerName}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${customerEmail}" style="color:#00ff88;">${customerEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#999;">Plan</td><td style="padding:8px 0;color:#f0c040;font-weight:bold;">${planName}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Phone</td><td style="padding:8px 0;">${customerPhone}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Discord</td><td style="padding:8px 0;">${discordUsername}</td></tr>
          </table>
        </div>
      `,
    });

    sendDiscordLog({
      title: "📧 Welcome Email Sent to Member",
      color: 0x00cc66,
      fields: [
        { name: "Name", value: customerName, inline: true },
        { name: "Plan", value: planName, inline: true },
        { name: "Email", value: customerEmail, inline: false },
      ],
      description: "Member notified via welcome email - source: Stripe checkout.session.completed",
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Welcome to 🔝Floor - You're in.`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
          <h1 style="color:#00ff88;margin-top:0;font-size:28px;">You're officially a 🔝Floor member.</h1>
          <p style="color:#aaa;line-height:1.6;">Hey ${customerName}, welcome to the community. You just made a real move.</p>
          <p style="color:#aaa;line-height:1.6;">Your plan: <strong style="color:#f0c040;">${planName}</strong></p>
          <p style="color:#aaa;line-height:1.6;">Log into your member dashboard to access your curriculum, book a coaching call, and see the full class schedule.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL}/dashboard" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
              Go to My Dashboard →
            </a>
          </div>
          <p style="color:#aaa;line-height:1.6;">Then join the private Discord - that's where live trades, alerts, and coaching sessions happen.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${DISCORD_INVITE}" style="display:inline-block;background:#5865F2;color:#fff;font-weight:bold;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:15px;">
              Join the Discord →
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
          <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results. 🔝Floor provides educational content only.</p>
        </div>
      `,
    });

    // Lifetime / one-time purchases don't generate a subscription invoice, so invoice.paid
    // never fires for them - send their receipt here. Monthly plans get theirs from invoice.paid.
    if (session.mode === "payment" && session.amount_total != null) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: "Your 🔝Floor payment receipt",
        html: paymentReceiptHtml({
          name: customerName,
          planName,
          amount: (session.amount_total / 100).toFixed(2),
          currency: (session.currency ?? "usd").toUpperCase(),
          invoiceUrl: null,
        }),
      }).catch((e) => console.error("Lifetime receipt email failed:", e));
    }
  }

  // ── Subscription cancelled (all retries exhausted or manually cancelled) ──
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const clerkUserId = subscription.metadata?.clerkUserId;

    // Get customer email + name from Stripe
    let memberEmail = "";
    let memberName = "Member";
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      memberEmail = customer.email ?? "";
      memberName = customer.name ?? "Member";
    } catch {}

    const cancelledPriceId = subscription.items?.data[0]?.price?.id ?? "";
    const cancelledPlanName = PLAN_NAMES[cancelledPriceId] ?? "Unknown";

    // Revoke Clerk access - but skip if they've already upgraded to lifetime
    const client = await clerkClient();
    const revokeAccess = async (userId: string) => {
      const user = await client.users.getUser(userId);
      if (user.publicMetadata?.tier === "lifetime") return; // don't revoke lifetime
      // Clear all payment-failure state so billing page doesn't show stale recovery UI
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          tier: null,
          cancelAt: null,
          suspendedTier: null,
          gracePeriodEnd: null,
          discordUserId: null,
          discordUsername: null,
        },
      });
      const discordUserId = user.publicMetadata?.discordUserId as string | undefined;
      await revokeProRole(discordUserId);
      // Remove from grace_periods so cron doesn't try to re-process a cancelled subscription
      await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", userId);
    };
    if (clerkUserId) {
      try {
        await revokeAccess(clerkUserId);
      } catch (err) {
        console.error("Failed to revoke Clerk tier on subscription deletion:", err);
      }
    } else if (memberEmail) {
      // Fallback: look up by email if clerkUserId missing (older subscriptions)
      try {
        const users = await client.users.getUserList({ emailAddress: [memberEmail] });
        if (users.data.length > 0) {
          await revokeAccess(users.data[0].id);
        }
      } catch (err) {
        console.error("Failed to revoke Clerk tier by email:", err);
      }
    }

    if (memberEmail) {
      sendDiscordLog({
        title: "❌ Member Cancelled",
        color: 0xff4444,
        fields: [
          { name: "Name", value: memberName, inline: true },
          { name: "Plan", value: cancelledPlanName, inline: true },
          { name: "Email", value: memberEmail, inline: false },
        ],
      });
      await Promise.all([
        resend.emails.send({
          from: FROM_EMAIL,
          to: memberEmail,
          subject: "Your 🔝Floor membership has ended",
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
              <h2 style="color:#f5f5f5;margin-top:0;">Your membership has ended</h2>
              <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, your 🔝Floor subscription has been cancelled and your dashboard access has been removed.</p>
              <p style="color:#aaa;line-height:1.6;">If this was a mistake or you'd like to rejoin, you can resubscribe anytime.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_URL}/pricing" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
                  Rejoin 🔝Floor →
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
              <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results.</p>
            </div>
          `,
        }),
        resend.emails.send({
          from: FROM_EMAIL,
          to: process.env.COACH_EMAIL!,
          subject: `❌ Member Cancelled - ${memberName}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
              <h2 style="color:#ff4444;margin-top:0;">Member Cancelled</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
                <tr><td style="padding:8px 0;color:#999;">Action</td><td style="padding:8px 0;color:#ff4444;">Subscription cancelled, dashboard access revoked</td></tr>
              </table>
            </div>
          `,
        }),
      ]).catch((e) => console.error("Cancel email failed:", e));
    }
  }

  // ── Payment failed - start 24-hour grace period ──
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice & { customer_email?: string; customer_name?: string; attempt_count?: number; subscription?: string };
    const memberEmail = invoice.customer_email ?? "";
    const memberName = invoice.customer_name ?? "Member";
    const attemptCount = invoice.attempt_count ?? 1;

    let failedPlanName = "Unknown";
    try {
      const lines = invoice.lines?.data ?? [];
      const priceId = (lines[0] as unknown as { price?: { id?: string } })?.price?.id ?? "";
      failedPlanName = PLAN_NAMES[priceId] ?? "Unknown";
    } catch {}

    // Give member 24 hours before revoking access - cron job fires the actual lock
    let gracedClerkId: string | null = null;
    try {
      const subId = getInvoiceSubscriptionId(invoice);
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        gracedClerkId = sub.metadata?.clerkUserId ?? null;
      }
      if (!gracedClerkId && memberEmail) {
        const clerk = await clerkClient();
        const users = await clerk.users.getUserList({ emailAddress: [memberEmail] });
        gracedClerkId = users.data[0]?.id ?? null;
      }
      if (gracedClerkId) {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(gracedClerkId);
        const currentTier = user.publicMetadata?.tier ?? null;
        if (currentTier && currentTier !== "lifetime") {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await clerk.users.updateUserMetadata(gracedClerkId, {
            publicMetadata: { gracePeriodEnd: expiresAt },
          });
          await supabaseAdmin.from("grace_periods").upsert({
            clerk_user_id: gracedClerkId,
            expires_at: expiresAt,
          });
          // Schedule a precise lock at grace + 24h (QStash). The daily cron is the backstop.
          await scheduleGraceRevoke(gracedClerkId);
        }
      }
    } catch (e) {
      console.error("Failed to start grace period on payment failure:", e);
    }

    if (memberEmail) {
      sendDiscordLog({
        title: "⚠️ Payment Failed - 24h Grace Period Started",
        color: 0xffa500,
        fields: [
          { name: "Name", value: memberName, inline: true },
          { name: "Attempt", value: `#${attemptCount}`, inline: true },
          { name: "Plan", value: failedPlanName, inline: true },
          { name: "Email", value: memberEmail, inline: false },
        ],
        description: "Access stays active for 24 hours. Auto-revoked by cron if not resolved.",
      });
      await Promise.all([
        resend.emails.send({
          from: FROM_EMAIL,
          to: memberEmail,
          subject: "Payment failed - update your card within 24 hours",
          text: `Hey ${memberName},\n\nWe couldn't process your TopFloor subscription payment.\n\nYou still have full access for the next 24 hours. Update your payment method before then and nothing changes.\n\nUpdate payment: ${process.env.NEXT_PUBLIC_URL}/dashboard/billing\n\nIf you don't update within 24 hours, your dashboard access and Discord Pro role will be removed automatically.\n\n---\nTrading involves significant risk. Past performance is not indicative of future results.`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;border:1px solid rgba(255,165,0,0.3);">
              <h2 style="color:#ffa500;margin-top:0;">Payment Failed - Action Required</h2>
              <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, we couldn't process your 🔝Floor subscription payment.</p>
              <p style="color:#aaa;line-height:1.6;"><strong style="color:#f5f5f5;">You still have full access for the next 24 hours.</strong> Update your payment method before then and nothing changes.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/billing" style="display:inline-block;background:#ffa500;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
                  Update Payment Method →
                </a>
              </div>
              <p style="color:#555;line-height:1.6;font-size:13px;">If you don't update within 24 hours, your dashboard access and Discord Pro role will be removed automatically. You can restore access at any time by updating your payment method.</p>
              <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
              <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results.</p>
            </div>
          `,
        }),
        resend.emails.send({
          from: FROM_EMAIL,
          to: process.env.COACH_EMAIL!,
          subject: `⚠️ Payment Failed - ${memberName} (attempt ${attemptCount}) - 24h Grace Period`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
              <h2 style="color:#ffa500;margin-top:0;">Payment Failed - Grace Period Started</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
                <tr><td style="padding:8px 0;color:#999;">Attempt</td><td style="padding:8px 0;color:#ffa500;font-weight:bold;">#${attemptCount}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Status</td><td style="padding:8px 0;color:#ffa500;">Access active - auto-revoked in 24h if unresolved</td></tr>
              </table>
            </div>
          `,
        }),
      ]).catch((e) => console.error("Payment failed email error:", e));
    }
  }

  // ── Payment succeeded - restore access if it was locked ──
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & { customer_email?: string; customer_name?: string; billing_reason?: string; subscription?: string };
    // Restore for any paid invoice on a subscription (cycle, update, or manual retry)
    const subscriptionId = getInvoiceSubscriptionId(invoice);
    const isSubscriptionPayment = invoice.billing_reason === "subscription_cycle"
      || invoice.billing_reason === "subscription_create"
      || invoice.billing_reason === "subscription_update"
      || invoice.billing_reason === "subscription_threshold"
      || !!subscriptionId;
    if (isSubscriptionPayment) {
      let restoredClerkId: string | null = null;
      let wasRecovery = false;
      try {
        const subId = subscriptionId;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          restoredClerkId = sub.metadata?.clerkUserId ?? null;
        }
        if (!restoredClerkId && invoice.customer_email) {
          const clerk = await clerkClient();
          const users = await clerk.users.getUserList({ emailAddress: [invoice.customer_email] });
          restoredClerkId = users.data[0]?.id ?? null;
        }
        if (restoredClerkId) {
          const clerk = await clerkClient();
          const user = await clerk.users.getUser(restoredClerkId);
          const suspendedTier = user.publicMetadata?.suspendedTier as Tier | null;
          const gracePeriodEnd = user.publicMetadata?.gracePeriodEnd as string | null;
          wasRecovery = !!(suspendedTier || gracePeriodEnd);
          if (suspendedTier) {
            // Cron already locked them - restore tier + Discord + clear all flags
            await clerk.users.updateUserMetadata(restoredClerkId, {
              publicMetadata: { tier: suspendedTier, suspendedTier: null, gracePeriodEnd: null },
            });
            const restoredUser = await clerk.users.getUser(restoredClerkId);
            const discordUserId = restoredUser.publicMetadata?.discordUserId as string | undefined;
            await grantProRole(discordUserId);
            sendDiscordLog({
              title: "✅ Access Restored",
              color: 0x00ff88,
              fields: [
                { name: "Name", value: invoice.customer_name ?? "Member", inline: true },
                { name: "Email", value: invoice.customer_email ?? "-", inline: true },
                { name: "Tier Restored", value: suspendedTier, inline: true },
              ],
              description: "Payment succeeded - member access has been restored.",
            });
          } else if (gracePeriodEnd) {
            // Paid within 24h grace window - tier was never suspended, just clear the flag
            await clerk.users.updateUserMetadata(restoredClerkId, {
              publicMetadata: { gracePeriodEnd: null },
            });
          }
          // Remove from grace period index regardless (no-op if already gone)
          await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", restoredClerkId);
        }
      } catch (e) {
        console.error("Failed to restore access on payment success:", e);
      }

      // Send the member a receipt for this payment (first month, renewal, or recovery),
      // and notify the coach when it's a recovery from a failed payment.
      try {
        const memberEmail = invoice.customer_email ?? "";
        if (memberEmail) {
          const memberName = invoice.customer_name ?? "there";
          const amount = ((invoice.amount_paid ?? 0) / 100).toFixed(2);
          const currency = (invoice.currency ?? "usd").toUpperCase();
          const priceId = (invoice.lines?.data?.[0] as unknown as { price?: { id?: string } })?.price?.id ?? "";
          const planName = PLAN_NAMES[priceId] ?? invoice.lines?.data?.[0]?.description ?? "🔝Floor Membership";
          const invoiceUrl = invoice.hosted_invoice_url ?? null;

          await resend.emails.send({
            from: FROM_EMAIL,
            to: memberEmail,
            subject: wasRecovery ? "Payment received - your 🔝Floor access is restored" : "Your 🔝Floor payment receipt",
            html: paymentReceiptHtml({ name: memberName, planName, amount, currency, invoiceUrl, restored: wasRecovery }),
          });

          if (wasRecovery) {
            sendDiscordLog({
              title: "✅ Member Recovered",
              color: 0x00ff88,
              fields: [
                { name: "Name", value: memberName, inline: true },
                { name: "Plan", value: planName, inline: true },
                { name: "Email", value: memberEmail, inline: false },
              ],
              description: "Payment succeeded after a failed payment - access restored.",
            });
            await resend.emails.send({
              from: FROM_EMAIL,
              to: process.env.COACH_EMAIL!,
              subject: `✅ Member Recovered - ${memberName}`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
                  <h2 style="color:#00ff88;margin-top:0;">Member Recovered 🎉</h2>
                  <p style="color:#aaa;">A member who had a failed payment just paid and had their access restored.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
                    <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
                    <tr><td style="padding:8px 0;color:#999;">Plan</td><td style="padding:8px 0;color:#f0c040;font-weight:bold;">${planName}</td></tr>
                    <tr><td style="padding:8px 0;color:#999;">Amount</td><td style="padding:8px 0;font-weight:bold;">$${amount} ${currency}</td></tr>
                  </table>
                </div>
              `,
            });
          }
        }
      } catch (e) {
        console.error("Failed to send payment receipt:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
