import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const name = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : email;

  const { call_type, preferred_time, topic } = await request.json() as {
    call_type: string;
    preferred_time: string;
    topic: string;
  };

  if (!preferred_time) return NextResponse.json({ error: "Preferred time is required" }, { status: 400 });

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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
