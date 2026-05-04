import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .select("*")
    .eq("is_booked", false)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time_est", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
