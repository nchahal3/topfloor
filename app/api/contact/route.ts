import { Resend } from "resend";
import { NextResponse } from "next/server";
import { sendDiscordLog } from "@/lib/discord";

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
    const { name, email, experience, challenge, message } = body as {
      name: string;
      email: string;
      experience?: string;
      challenge?: string;
      message?: string;
    };

    const messageText = challenge ?? message ?? "";

    if (!name || !email || !messageText) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const experienceLabels: Record<string, string> = {
      beginner: "Complete beginner — never traded before",
      some: "Some experience — still figuring it out",
      struggling: "Experienced but struggling to be consistent",
      mentorship: "Looking for 1-on-1 mentorship specifically",
    };

    await resend.emails.send({
      from: "noreply@topfloortradesofficial.com",
      to: process.env.COACH_EMAIL!,
      replyTo: email,
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
              <td style="padding:8px 0;">${experience ? escapeHtml(experienceLabels[experience] ?? experience) : "Not specified"}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
          <p style="color:#999;margin-bottom:8px;">Message</p>
          <p style="white-space:pre-wrap;line-height:1.6;background:#111;padding:16px;border-radius:8px;border-left:3px solid #00ff88;">${escapeHtml(messageText)}</p>
        </div>
      `,
    });

    sendDiscordLog({
      title: "📩 Contact Form",
      color: 0x5865f2,
      fields: [
        { name: "Name", value: escapeHtml(name), inline: true },
        { name: "Level", value: experience ? escapeHtml(experienceLabels[experience] ?? experience) : "Not specified", inline: true },
        { name: "Email", value: escapeHtml(email), inline: false },
        { name: "Message", value: escapeHtml(messageText).slice(0, 200), inline: false },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
