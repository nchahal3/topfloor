import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdminAuth() {
  const c = await cookies();
  return c.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
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

  const body = await request.json() as { date: string; time_est: string; duration_minutes?: number; call_type?: string };
  if (!body.date || !body.time_est) {
    return NextResponse.json({ error: "date and time_est are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .insert({
      date: body.date,
      time_est: body.time_est,
      duration_minutes: body.duration_minutes ?? 30,
      call_type: body.call_type ?? "any",
      is_booked: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
