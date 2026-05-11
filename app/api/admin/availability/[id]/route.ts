import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdminAuth() {
  const c = await cookies();
  return c.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

const ALLOWED_PATCH_FIELDS = new Set(["call_type", "duration_minutes"]);

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Prevent deleting a slot that has an active booking
  const { data: slot } = await supabaseAdmin
    .from("availability_slots")
    .select("is_booked")
    .eq("id", id)
    .single();

  if (slot?.is_booked) {
    return NextResponse.json(
      { error: "Cannot delete a slot that is already booked. Cancel the booking first." },
      { status: 409 },
    );
  }

  const { error } = await supabaseAdmin.from("availability_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const rawBody = await request.json() as Record<string, unknown>;

  // Only allow safe fields to be updated via this endpoint
  const safeBody = Object.fromEntries(
    Object.entries(rawBody).filter(([key]) => ALLOWED_PATCH_FIELDS.has(key)),
  );

  if (Object.keys(safeBody).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("availability_slots")
    .update(safeBody)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
