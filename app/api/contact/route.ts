import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, experience, challenge } = body as {
      name: string;
      email: string;
      experience: string;
      challenge: string;
    };

    if (!name || !email || !experience || !challenge) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const experienceLabels: Record<string, string> = {
      beginner: "Complete beginner — never traded before",
      some: "Some experience — still figuring it out",
      struggling: "Experienced but struggling to be consistent",
      mentorship: "Looking for 1-on-1 mentorship specifically",
    };

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "nabi.chahal@gmail.com",
      subject: `New lead from ${escapeHtml(name)} — 🔝Floor`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
          <h2 style="color:#00ff88;margin-top:0;">New 🔝Floor Lead</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#999;width:100px;">Name</td>
              <td style="padding:8px 0;font-weight:bold;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#999;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#00ff88;">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#999;vertical-align:top;">Level</td>
              <td style="padding:8px 0;">${escapeHtml(experienceLabels[experience] ?? experience)}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
          <p style="color:#999;margin-bottom:8px;">Biggest trading challenge</p>
          <p style="white-space:pre-wrap;line-height:1.6;background:#111;padding:16px;border-radius:8px;border-left:3px solid #00ff88;">${escapeHtml(challenge)}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
