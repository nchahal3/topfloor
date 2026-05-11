import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { timeToMinutes, minutesToTime, sortByTimeEst } from "@/lib/time";

async function checkAdminAuth() {
  const c = await cookies();
  return c.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .select("*")
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort each day's slots chronologically
  const byDate = (data ?? []).reduce<Record<string, typeof data>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date]!.push(slot);
    return acc;
  }, {});

  const sorted = Object.keys(byDate)
    .sort()
    .flatMap((date) => sortByTimeEst(byDate[date]!));

  return NextResponse.json(sorted);
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

  const dateObj = new Date(body.date + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

  // Fetch sessions that could conflict on this date
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("time_est, duration_minutes, is_recurring, day, scheduled_for");

  const blockedRanges = (sessions ?? [])
    .filter((s) =>
      (s.is_recurring && s.day === dayName) ||
      (!s.is_recurring && s.scheduled_for === body.date),
    )
    .map((s: { time_est: string; duration_minutes: number }) => ({
      start: timeToMinutes(s.time_est),
      end: timeToMinutes(s.time_est) + (s.duration_minutes ?? 60),
    }));

  // Fetch existing slots for this date to prevent duplicates
  const { data: existingSlots } = await supabaseAdmin
    .from("availability_slots")
    .select("time_est")
    .eq("date", body.date);

  const existingTimes = new Set((existingSlots ?? []).map((s: { time_est: string }) => s.time_est));

  const startMin = timeToMinutes(body.start_time);
  const endMin = timeToMinutes(body.end_time);

  const toCreate: { date: string; time_est: string; duration_minutes: number; call_type: string; is_booked: boolean }[] = [];
  const skipped: { time_est: string; reason: string }[] = [];

  for (let t = startMin; t + duration <= endMin; t += duration) {
    const timeStr = minutesToTime(t);

    if (existingTimes.has(timeStr)) {
      skipped.push({ time_est: timeStr, reason: "already_exists" });
    } else if (blockedRanges.some((r) => t < r.end && t + duration > r.start)) {
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
