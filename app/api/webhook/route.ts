import Stripe from "stripe";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Tier } from "@/lib/tier";
import { PRICE_TIER } from "@/lib/tier";

const FROM_EMAIL = "noreply@topfloortradesofficial.com";
const DISCORD_INVITE = "https://discord.gg/TVxNWph5BQ";

const PLAN_NAMES: Record<string, string> = {
  price_1TiikP8sHKVNeGWtxjodurtl: "Bronze ($200/mo)",
  price_1Tiike8sHKVNeGWtJr1gxDZx: "Silver ($500/mo)",
  price_1Tiiku8sHKVNeGWtthSeTog0: "Gold ($750/mo)",
  price_1Tiil68sHKVNeGWt4SFHY6P5: "Lifetime ($2,000)",
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
    if (clerkUserId && tier) {
      try {
        const client = await clerkClient();
        const existingUser = await client.users.getUser(clerkUserId);
        const existingTier = existingUser.publicMetadata?.tier;
        if (existingTier === tier) {
          alreadyProcessed = true;
        } else {
          await client.users.updateUserMetadata(clerkUserId, {
            publicMetadata: { tier, pendingLifetime: false },
          });
        }
      } catch (err) {
        console.error("Failed to update Clerk user tier:", err);
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

    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }

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

  return NextResponse.json({ received: true });
}
