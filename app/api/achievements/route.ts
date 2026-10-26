import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import { sendDiscordLog } from "@/lib/discord";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("achievements")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const { category, notes, file_path, review_quote, review_role } = await request.json();

  if (!category || !file_path) {
    return NextResponse.json({ error: "category and file_path required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("achievements")
    .insert({
      clerk_user_id: userId,
      member_email: user?.emailAddresses[0]?.emailAddress ?? "",
      member_name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null,
      category,
      notes: notes ?? null,
      file_path,
      review_quote: review_quote ?? null,
      review_role: review_role ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (category === "payout_request") {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const memberName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "A member";
      const memberEmail = user?.emailAddresses[0]?.emailAddress ?? "Unknown";
      await resend.emails.send({
        from: "noreply@topfloortradesofficial.com",
        to: process.env.COACH_EMAIL!,
        subject: `💸 New Payout Request - ${memberName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
            <h2 style="color:#00ff88;margin-top:0;">New Payout Request Submitted</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#999;width:80px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
              <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
              ${notes ? `<tr><td style="padding:8px 0;color:#999;">Notes</td><td style="padding:8px 0;">${notes}</td></tr>` : ""}
            </table>
            <p style="color:#aaa;margin-top:16px;font-size:13px;">Review it in the admin dashboard under Achievements.</p>
          </div>
        `,
      });
      sendDiscordLog({
        title: "💸 Payout Request",
        color: 0xf0c040,
        fields: [
          { name: "Name", value: memberName, inline: true },
          { name: "Email", value: memberEmail, inline: true },
          ...(notes ? [{ name: "Notes", value: notes as string, inline: false }] : []),
        ],
      });
    } catch {}
  }

  return NextResponse.json(data);
}
