import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("curriculum_modules")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Lessons cascade via FK, but also delete any PDFs from storage
  const { data: lessons } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("pdf_path")
    .eq("module_id", id);

  if (lessons) {
    const paths = lessons.map((l) => l.pdf_path).filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("curriculum").remove(paths);
    }
  }

  const { error } = await supabaseAdmin.from("curriculum_modules").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
