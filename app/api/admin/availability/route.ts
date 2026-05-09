import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdminAuth() {
  const c = await cookies();
  return c.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

function timeToMinutes(time: string): number {
  const [timePart, period] = time.split(" ");
  const [h, m] = timePart.split(":").map(Number);
  let total = h * 60 + m;
  if (period === "PM" && h !== 12) total += 720;
  if (period === "AM" && h === 12) total -= 720;
  return total;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}

export async function GET() {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .select("*")
    .order("date", { ascending: true })
    .order("time_est", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    call_type?: string;
  };

  if (!body.date || !body.start_time || !body.end_time) {
    return NextResponse.json({ error: "date, start_time, and end_time are required" }, { status: 400 });
  }

  const duration = body.duration_minutes ?? 30;
  const callType = body.call_type ?? "any";

  // Derive day name for recurring session conflict check
  const dateObj = new Date(body.date + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

  // Fetch sessions that could conflict on this date
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("time_est, is_recurring, day, scheduled_for");

  const conflictTimes = new Set(
    (sessions ?? [])
      .filter((s) =>
        (s.is_recurring && s.day === dayName) ||
        (!s.is_recurring && s.scheduled_for === body.date)
      )
      .map((s: { time_est: string }) => s.time_est)
  );

  // Generate slot times from start to end
  const startMin = timeToMinutes(body.start_time);
  const endMin = timeToMinutes(body.end_time);

  const toCreate: { date: string; time_est: string; duration_minutes: number; call_type: string; is_booked: boolean }[] = [];
  const skipped: { time_est: string; reason: string }[] = [];

  for (let t = startMin; t + duration <= endMin; t += duration) {
    const timeStr = minutesToTime(t);
    if (conflictTimes.has(timeStr)) {
      skipped.push({ time_est: timeStr, reason: "session_conflict" });
    } else {
      toCreate.push({ date: body.date, time_est: timeStr, duration_minutes: duration, call_type: callType, is_booked: false });
    }
  }

  if (toCreate.length === 0) {
    return NextResponse.json({ created: [], skipped });
  }

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .insert(toCreate)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: data, skipped });
}
