import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sortByTimeEst } from "@/lib/time";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const { userId } = await auth();

  if (userId) {
    const { data: activeBookings } = await supabaseAdmin
      .from("bookings")
      .select("id, status, preferred_time, call_type, zoom_link")
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
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort by date then by time (chronological, not alphabetical)
  const slots = (data ?? []).reduce<Record<string, typeof data>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date]!.push(slot);
    return acc;
  }, {});

  const sorted = Object.keys(slots)
    .sort()
    .flatMap((date) => sortByTimeEst(slots[date]!));

  return NextResponse.json({ slots: sorted, activeBooking: null });
}
