import Stripe from "stripe";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Tier } from "@/lib/tier";
import { PRICE_TIER } from "@/lib/tier";
import { sendDiscordLog } from "@/lib/discord";

const FROM_EMAIL = "noreply@topfloortradesofficial.com";
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
              pendingLifetime: false,
              phone: customerPhone !== "Not provided" ? customerPhone : undefined,
              discordUsername: discordUsername !== "Not provided" ? discordUsername : undefined,
            },
          });
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
          subject: `⚠️ URGENT: Failed to grant dashboard access — ${customerName}`,
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
      subject: `💰 New 🔝Floor Member — ${customerName}`,
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
      description: "Member notified via welcome email — source: Stripe checkout.session.completed",
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Welcome to 🔝Floor — You're in.`,
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
          <p style="color:#aaa;line-height:1.6;">Then join the private Discord — that's where live trades, alerts, and coaching sessions happen.</p>
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

    // Revoke Clerk access
    const client = await clerkClient();
    if (clerkUserId) {
      try {
        await client.users.updateUserMetadata(clerkUserId, { publicMetadata: { tier: null, cancelAt: null } });
      } catch (err) {
        console.error("Failed to revoke Clerk tier on subscription deletion:", err);
      }
    } else if (memberEmail) {
      // Fallback: look up by email if clerkUserId missing (older subscriptions)
      try {
        const users = await client.users.getUserList({ emailAddress: [memberEmail] });
        if (users.data.length > 0) {
          await client.users.updateUserMetadata(users.data[0].id, { publicMetadata: { tier: null, cancelAt: null } });
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
          subject: `❌ Member Cancelled — ${memberName}`,
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

  // ── Payment failed — lock account immediately ──
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

    // Lock account immediately — save current tier so we can restore it on payment success
    let lockedClerkId: string | null = null;
    try {
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        lockedClerkId = sub.metadata?.clerkUserId ?? null;
      }
      if (!lockedClerkId && memberEmail) {
        const clerk = await clerkClient();
        const users = await clerk.users.getUserList({ emailAddress: [memberEmail] });
        lockedClerkId = users.data[0]?.id ?? null;
      }
      if (lockedClerkId) {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(lockedClerkId);
        const currentTier = user.publicMetadata?.tier ?? null;
        if (currentTier) {
          await clerk.users.updateUserMetadata(lockedClerkId, {
            publicMetadata: { tier: null, suspendedTier: currentTier },
          });
        }
      }
    } catch (e) {
      console.error("Failed to lock account on payment failure:", e);
    }

    if (memberEmail) {
      sendDiscordLog({
        title: "⚠️ Payment Failed — Access Locked",
        color: 0xffa500,
        fields: [
          { name: "Name", value: memberName, inline: true },
          { name: "Attempt", value: `#${attemptCount}`, inline: true },
          { name: "Plan", value: failedPlanName, inline: true },
          { name: "Email", value: memberEmail, inline: false },
        ],
        description: "Account locked immediately. Access restored automatically when payment succeeds.",
      });
      await Promise.all([
        resend.emails.send({
          from: FROM_EMAIL,
          to: memberEmail,
          subject: "⚠️ Payment failed — your access has been paused",
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;border:1px solid rgba(255,165,0,0.3);">
              <h2 style="color:#ffa500;margin-top:0;">Payment Failed — Access Paused</h2>
              <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, we couldn't process your 🔝Floor subscription payment and your access has been temporarily paused.</p>
              <p style="color:#aaa;line-height:1.6;">Update your payment method and your access will be restored immediately.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/billing" style="display:inline-block;background:#ffa500;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
                  Update Payment Method →
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
          subject: `⚠️ Payment Failed — ${memberName} (attempt ${attemptCount}) — Access Locked`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
              <h2 style="color:#ffa500;margin-top:0;">Payment Failed</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
                <tr><td style="padding:8px 0;color:#999;">Attempt</td><td style="padding:8px 0;color:#ffa500;font-weight:bold;">#${attemptCount}</td></tr>
                <tr><td style="padding:8px 0;color:#999;">Status</td><td style="padding:8px 0;color:#ff4444;">Access locked — pending payment update</td></tr>
              </table>
            </div>
          `,
        }),
      ]).catch((e) => console.error("Payment failed email error:", e));
    }
  }

  // ── Payment succeeded — restore access if it was locked ──
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & { customer_email?: string; customer_name?: string; billing_reason?: string; subscription?: string };
    if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_update") {
      let restoredClerkId: string | null = null;
      try {
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
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
          if (suspendedTier) {
            await clerk.users.updateUserMetadata(restoredClerkId, {
              publicMetadata: { tier: suspendedTier, suspendedTier: null },
            });
            sendDiscordLog({
              title: "✅ Access Restored",
              color: 0x00ff88,
              fields: [
                { name: "Name", value: invoice.customer_name ?? "Member", inline: true },
                { name: "Email", value: invoice.customer_email ?? "—", inline: true },
                { name: "Tier Restored", value: suspendedTier, inline: true },
              ],
              description: "Payment succeeded — member access has been restored.",
            });
          }
        }
      } catch (e) {
        console.error("Failed to restore access on payment success:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
