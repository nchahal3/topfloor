import { getAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === getAdminToken();
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: modules, error: modError } = await supabaseAdmin
    .from("curriculum_modules")
    .select("*")
    .order("order_index", { ascending: true });

  if (modError) return NextResponse.json({ error: modError.message }, { status: 500 });

  const { data: lessons, error: lesError } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("*")
    .order("order_index", { ascending: true });

  if (lesError) return NextResponse.json({ error: lesError.message }, { status: 500 });

  const result = (modules ?? []).map((mod) => ({
    ...mod,
    lessons: (lessons ?? []).filter((l) => l.module_id === mod.id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, tier } = body;

  // Get max order_index
  const { data: maxRow } = await supabaseAdmin
    .from("curriculum_modules")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("curriculum_modules")
    .insert({ title, description, tier, order_index })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
