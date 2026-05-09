import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const name = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : email;

  const { call_type, preferred_time, topic, slot_id } = await request.json() as {
    call_type: string;
    preferred_time: string;
    topic: string;
    slot_id?: string;
  };

  if (!preferred_time) return NextResponse.json({ error: "Preferred time is required" }, { status: 400 });

  // If slot provided, verify it's still available and get datetime
  let scheduledAt: string | null = null;
  if (slot_id) {
    const { data: slot } = await supabaseAdmin
      .from("availability_slots")
      .select("id, is_booked, date, time_est")
      .eq("id", slot_id)
      .single();

    if (!slot || slot.is_booked) {
      return NextResponse.json({ error: "That time slot is no longer available. Please choose another." }, { status: 409 });
    }

    // Convert slot date + time_est to ISO datetime for scheduled_at
    if (slot.date && slot.time_est) {
      const [timePart, period] = (slot.time_est as string).split(" ");
      const [h, m] = timePart.split(":").map(Number);
      let hours = h;
      if (period === "PM" && h !== 12) hours += 12;
      if (period === "AM" && h === 12) hours = 0;
      scheduledAt = `${slot.date}T${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      member_email: email,
      member_name: name,
      clerk_user_id: userId,
      call_type: call_type ?? "intro",
      preferred_time,
      topic: topic ?? null,
      status: "pending",
      slot_id: slot_id ?? null,
      scheduled_at: scheduledAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark slot as booked
  if (slot_id && data) {
    await supabaseAdmin
      .from("availability_slots")
      .update({ is_booked: true, booking_id: data.id })
      .eq("id", slot_id);
  }

  return NextResponse.json(data);
}
