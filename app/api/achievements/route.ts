import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("achievements")
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
  const { category, notes, file_path, review_quote, review_role } = await request.json();

  if (!category || !file_path) {
    return NextResponse.json({ error: "category and file_path required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("achievements")
    .insert({
      clerk_user_id: userId,
      member_email: user?.emailAddresses[0]?.emailAddress ?? "",
      member_name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null,
      category,
      notes: notes ?? null,
      file_path,
      review_quote: review_quote ?? null,
      review_role: review_role ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
