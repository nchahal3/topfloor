import { getAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === getAdminToken();
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { module_id, title, notes, video_id } = body;

  // Get max order_index within this module
  const { data: maxRow } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("order_index")
    .eq("module_id", module_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("curriculum_lessons")
    .insert({ module_id, title, notes: notes ?? null, video_id: video_id ?? null, order_index })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
