import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const { userId } = await auth();

  // If member already has a pending or confirmed booking, return no slots
  if (userId) {
    const { data: activeBookings } = await supabaseAdmin
      .from("bookings")
      .select("id, status, preferred_time, call_type")
      .eq("clerk_user_id", userId)
      .in("status", ["pending", "confirmed"])
      .limit(1);

    if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json({ slots: [], activeBooking: activeBookings[0] });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .select("*")
    .eq("is_booked", false)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time_est", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data ?? [], activeBooking: null });
}
