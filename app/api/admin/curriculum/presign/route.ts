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

  const { lessonId } = await request.json();
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const timestamp = Date.now();
  const path = `${lessonId}/${timestamp}.pdf`;

  // Remove old PDF if one exists
  const { data: lesson } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("pdf_path")
    .eq("id", lessonId)
    .maybeSingle();

  if (lesson?.pdf_path) {
    await supabaseAdmin.storage.from("Curriculum").remove([lesson.pdf_path]);
  }

  const { data, error } = await supabaseAdmin.storage
    .from("Curriculum")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  // Pre-update DB with the path - upload goes directly to Supabase so no confirm step needed
  await supabaseAdmin
    .from("curriculum_lessons")
    .update({ pdf_path: path })
    .eq("id", lessonId);

  return NextResponse.json({ signedUrl: data.signedUrl, path });
}
