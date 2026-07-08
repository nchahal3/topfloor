import { getAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === getAdminToken();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Two distinct admin actions share this route:
  //  - review: set status (+ optional admin_notes)
  //  - feature: toggle `featured` to promote/demote on the public Results carousel
  const update: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    update.status = body.status;
    update.admin_notes = body.admin_notes ?? null;
    // Demoting out of "approved" must never leave a stale featured row public.
    if (body.status !== "approved") update.featured = false;
  }

  if (typeof body.featured === "boolean") {
    update.featured = body.featured;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Guard: can only feature a row that is currently approved.
  if (update.featured === true) {
    const { data: existing } = await supabaseAdmin
      .from("achievements")
      .select("status")
      .eq("id", id)
      .single();
    const willBeApproved = update.status === "approved" || existing?.status === "approved";
    if (!willBeApproved) {
      return NextResponse.json({ error: "Only approved achievements can be featured" }, { status: 400 });
    }
  }

  const { error } = await supabaseAdmin
    .from("achievements")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
