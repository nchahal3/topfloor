import Stripe from "stripe";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

const PLAN_NAMES: Record<string, string> = {
  price_1TPYX3RxClGX2uTFzwnMHkP2: "Foundation ($500/mo)",
  price_1TPYXsRxClGX2uTFcMCkSlMo: "Elite Mentorship ($750/mo)",
  price_1TPYYGRxClGX2uTF7o1v901o: "Elite Mentorship Lifetime ($2,000)",
};

const DISCORD_INVITE = "https://discord.gg/kxnfaPNC";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "payment_intent.succeeded"
  ) {
    const session = event.data.object as Stripe.CheckoutSession;
    const customerEmail = session.customer_details?.email ?? "Unknown";
    const customerName = session.customer_details?.name ?? "New Member";

    // Get plan name from line items
    let planName = "🔝Floor Membership";
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id ?? "";
      planName = PLAN_NAMES[priceId] ?? planName;
    } catch {}

    // 1. Notify coach
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "nabi.chahal@gmail.com",
      subject: `💰 New 🔝Floor Member — ${customerName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
          <h2 style="color:#00ff88;margin-top:0;">New Member Just Signed Up 🔥</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#999;width:100px;">Name</td>
              <td style="padding:8px 0;font-weight:bold;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#999;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${customerEmail}" style="color:#00ff88;">${customerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#999;">Plan</td>
              <td style="padding:8px 0;color:#f0c040;font-weight:bold;">${planName}</td>
            </tr>
          </table>
        </div>
      `,
    });

    // 2. Welcome email to customer
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: customerEmail,
      subject: `Welcome to 🔝Floor — You're in.`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
          <h1 style="color:#00ff88;margin-top:0;font-size:28px;">You're officially a 🔝Floor member.</h1>
          <p style="color:#aaa;line-height:1.6;">Hey ${customerName}, welcome to the community. You just made a real move.</p>
          <p style="color:#aaa;line-height:1.6;">Your plan: <strong style="color:#f0c040;">${planName}</strong></p>
          <p style="color:#aaa;line-height:1.6;">Your first step is to join the private Discord. That's where everything happens — trade alerts, live sessions, coaching, and the community.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${DISCORD_INVITE}" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
              Join the Discord →
            </a>
          </div>
          <p style="color:#666;font-size:13px;line-height:1.6;">If you have any questions reply to this email or reach out in Discord. Coach Floor checks in daily.</p>
          <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
          <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results. 🔝Floor provides educational content only.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ received: true });
}
