import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify this booking belongs to this user and is still pending
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("id, clerk_user_id, status, slot_id")
    .eq("id", id)
    .single();

  if (!booking || booking.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!["pending", "confirmed"].includes(booking.status)) {
    return NextResponse.json({ error: "Cannot cancel a completed or already cancelled booking" }, { status: 400 });
  }

  // Cancel the booking
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Free up the slot so others can book it
  if (booking.slot_id) {
    await supabaseAdmin
      .from("availability_slots")
      .update({ is_booked: false, booking_id: null })
      .eq("id", booking.slot_id);
  }

  return NextResponse.json({ success: true });
}
