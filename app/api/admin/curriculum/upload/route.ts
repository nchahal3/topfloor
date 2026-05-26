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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const lessonId = formData.get("lessonId") as string | null;

  if (!file || !lessonId) {
    return NextResponse.json({ error: "file and lessonId are required" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  const timestamp = Date.now();
  const path = `${lessonId}/${timestamp}.pdf`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Remove old PDF if one exists
  const { data: lesson } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("pdf_path")
    .eq("id", lessonId)
    .maybeSingle();

  if (lesson?.pdf_path) {
    await supabaseAdmin.storage.from("Curriculum").remove([lesson.pdf_path]);
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from("Curriculum")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: updateError } = await supabaseAdmin
    .from("curriculum_lessons")
    .update({ pdf_path: path })
    .eq("id", lessonId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ path });
}
