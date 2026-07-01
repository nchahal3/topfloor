import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("bookings")
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
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const name = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : email;

  const { call_type, preferred_time, topic, slot_id } = await request.json() as {
    call_type: string;
    preferred_time: string;
    topic: string;
    slot_id?: string;
  };

  if (!preferred_time) {
    return NextResponse.json({ error: "Preferred time is required" }, { status: 400 });
  }

  if (!["intro", "trade_review"].includes(call_type)) {
    return NextResponse.json({ error: "Invalid call type" }, { status: 400 });
  }

  // Server-side tier check: Trade Review requires an active subscription
  if (call_type === "trade_review") {
    const tier = user?.publicMetadata?.tier;
    if (!tier) {
      return NextResponse.json(
        { error: "Trade Review sessions require an active subscription." },
        { status: 403 },
      );
    }
  }

  let scheduledAt: string | null = null;

  if (slot_id) {
    // Atomically claim the slot - only succeeds if still available (race-condition safe)
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slot_id)
      .eq("is_booked", false)
      .select("id, date, time_est")
      .single();

    if (claimError || !claimed) {
      return NextResponse.json(
        { error: "That time slot is no longer available. Please choose another." },
        { status: 409 },
      );
    }

    const [timePart, period] = (claimed.time_est as string).split(" ");
    const [h, m] = timePart.split(":").map(Number);
    let hours = h;
    if (period === "PM" && h !== 12) hours += 12;
    if (period === "AM" && h === 12) hours = 0;
    scheduledAt = `${claimed.date}T${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

  if (error) {
    // Release the slot if booking insert failed
    if (slot_id) {
      await supabaseAdmin
        .from("availability_slots")
        .update({ is_booked: false })
        .eq("id", slot_id);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Link the slot back to this booking
  if (slot_id && data) {
    await supabaseAdmin
      .from("availability_slots")
      .update({ booking_id: data.id })
      .eq("id", slot_id);
  }

  return NextResponse.json(data);
}
