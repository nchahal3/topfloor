import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, fileName } = await request.json();
  if (!category) return NextResponse.json({ error: "category required" }, { status: 400 });

  const timestamp = Date.now();
  const ext = (fileName as string)?.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${category}/${timestamp}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("achievements")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path });
}
