import { getAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdminAuth() {
  const c = await cookies();
  return c.get("admin_auth")?.value === getAdminToken();
}

export async function GET(request: Request) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  let query = supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false });
  if (email) query = query.eq("member_email", email);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({ ...body, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
