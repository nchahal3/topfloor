import { getAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { sendDiscordLog } from "@/lib/discord";

async function checkAdminAuth() {
  const c = await cookies();
  return c.get("admin_auth")?.value === getAdminToken();
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { status?: string; zoom_link?: string; scheduled_at?: string; admin_notes?: string };

  // Fetch current booking to detect status change and get slot reference
  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("status, member_email, member_name, preferred_time, call_type, zoom_link, slot_id")
    .eq("id", id)
    .single();

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Free the slot when admin cancels
  if (existing && body.status === "cancelled" && existing.status !== "cancelled" && existing.slot_id) {
    await supabaseAdmin
      .from("availability_slots")
      .update({ is_booked: false, booking_id: null })
      .eq("id", existing.slot_id);
  }

  // Send email if status changed
  if (existing && body.status && body.status !== existing.status) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const memberName = existing.member_name ?? "Member";
    const memberEmail = existing.member_email;
    const callLabel = existing.call_type === "intro" ? "Intro Call" : "Trade Review";
    const time = existing.preferred_time;
    const zoomLink = body.zoom_link ?? existing.zoom_link;
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://www.topfloortradesofficial.com";
    const fromEmail = "noreply@topfloortradesofficial.com";

    if (body.status === "confirmed") {
      sendDiscordLog({
        title: "✅ Booking Confirmed",
        color: 0x00ff88,
        fields: [
          { name: "Member", value: memberName, inline: true },
          { name: "Call Type", value: callLabel, inline: true },
          { name: "Time", value: time ?? "TBD", inline: true },
          { name: "Notified", value: memberEmail, inline: false },
        ],
        description: "Confirmation email sent to member - source: Admin Panel",
      });
      await resend.emails.send({
        from: fromEmail,
        to: memberEmail,
        subject: `✅ Your 🔝Floor Call is Confirmed - ${time}`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
            <h2 style="color:#00ff88;margin-top:0;">Your call is confirmed!</h2>
            <p style="color:#aaa;">Hey ${memberName}, your <strong style="color:#f5f5f5;">${callLabel}</strong> with the TopFloor team is locked in.</p>
            <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0 0 6px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Scheduled For</p>
              <p style="margin:0;color:#f5f5f5;font-weight:700;font-size:16px;">${time} (EST)</p>
            </div>
            ${zoomLink ? `
            <div style="text-align:center;margin:28px 0;">
              <a href="${zoomLink}" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:15px;">
                Join Call →
              </a>
            </div>
            <p style="color:#555;font-size:12px;text-align:center;">Or copy this link: <a href="${zoomLink}" style="color:#00ff88;">${zoomLink}</a></p>
            ` : `<p style="color:#aaa;">The TopFloor team will send your meeting link shortly.</p>`}
            <a href="${baseUrl}/dashboard/book-a-call" style="display:inline-block;margin-top:8px;color:#00ff88;font-size:13px;">View in dashboard →</a>
            <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
            <p style="color:#444;font-size:11px;">Trading involves significant risk. 🔝Floor provides educational content only.</p>
          </div>
        `,
      }).catch(console.error);
    }

    if (body.status === "cancelled") {
      sendDiscordLog({
        title: "🚫 Booking Cancelled",
        color: 0xff4444,
        fields: [
          { name: "Member", value: memberName, inline: true },
          { name: "Call Type", value: callLabel, inline: true },
          { name: "Time", value: time ?? "TBD", inline: true },
          { name: "Notified", value: memberEmail, inline: false },
        ],
        description: "Cancellation email sent to member - source: Admin Panel",
      });
      await resend.emails.send({
        from: fromEmail,
        to: memberEmail,
        subject: `Your 🔝Floor call has been cancelled`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
            <h2 style="color:#ff4444;margin-top:0;">Call Cancelled</h2>
            <p style="color:#aaa;">Hey ${memberName}, your <strong style="color:#f5f5f5;">${callLabel}</strong> scheduled for <strong style="color:#f5f5f5;">${time} (EST)</strong> has been cancelled.</p>
            <p style="color:#aaa;">You can book a new slot anytime from your dashboard.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${baseUrl}/dashboard/book-a-call" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:15px;">
                Book a New Slot →
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
            <p style="color:#444;font-size:11px;">Trading involves significant risk. 🔝Floor provides educational content only.</p>
          </div>
        `,
      }).catch(console.error);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select("status, slot_id")
    .eq("id", id)
    .single();

  if (existing && ["pending", "confirmed"].includes(existing.status)) {
    return NextResponse.json({ error: "Cannot delete an active booking. Cancel it first." }, { status: 400 });
  }

  if (existing?.slot_id) {
    await supabaseAdmin
      .from("availability_slots")
      .update({ is_booked: false, booking_id: null })
      .eq("id", existing.slot_id);
  }

  const { error } = await supabaseAdmin.from("bookings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
