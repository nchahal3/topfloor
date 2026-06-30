import { Webhook } from "svix";
import { Resend } from "resend";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await request.text();

  let payload: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (payload.type !== "user.created") {
    return NextResponse.json({ received: true });
  }

  const emailAddresses = payload.data.email_addresses as Array<{ email_address: string }> | undefined;
  const firstName = (payload.data.first_name as string | null) ?? null;
  const email = emailAddresses?.[0]?.email_address;

  if (!email) {
    return NextResponse.json({ received: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const greeting = firstName ? `Hey ${firstName}` : "Hey";
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  await resend.emails.send({
    from: "noreply@topfloortradesofficial.com",
    to: email,
    subject: "Welcome to 🔝Floor — Your account is ready",
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
        <h1 style="color:#00ff88;margin-top:0;font-size:26px;">Welcome to 🔝Floor.</h1>
        <p style="color:#aaa;line-height:1.7;">${greeting}, your account is live. You now have free access to the member dashboard — funded account promo codes, the class schedule, and the ability to book a free intro call with the TopFloor team.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${baseUrl}/dashboard" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:15px;">
            Go to My Dashboard →
          </a>
        </div>
        <p style="color:#aaa;line-height:1.7;">When you're ready to unlock live trade sessions, the full curriculum, and 1-on-1 coaching — upgrade your membership from inside the dashboard.</p>
        <p style="color:#aaa;line-height:1.7;">You can also join the Discord to connect with the community right now:</p>
        <div style="text-align:center;margin:20px 0 28px;">
          <a href="${baseUrl}/discord" style="display:inline-block;background:#5865F2;color:#fff;font-weight:bold;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;">
            Join the Discord →
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #1e1e1e;margin:24px 0;" />
        <p style="color:#333;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results. 🔝Floor provides educational content only.</p>
      </div>
    `,
  });

  return NextResponse.json({ received: true });
}
