import { getAdminToken } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === getAdminToken();
}

export async function GET(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const { data, error } = await supabaseAdmin.storage
    .from("achievements")
    .createSignedUrl(path, 3600);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
