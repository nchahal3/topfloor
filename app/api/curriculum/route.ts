import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hasAccess } from "@/lib/tier";
import type { Tier } from "@/lib/tier";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get tier from Clerk publicMetadata
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const tier = (user.publicMetadata?.tier as Tier) ?? null;

  // Fetch modules ordered by order_index
  const { data: modules, error: modError } = await supabaseAdmin
    .from("curriculum_modules")
    .select("*")
    .order("order_index", { ascending: true });

  if (modError) return NextResponse.json({ error: modError.message }, { status: 500 });

  // Fetch all lessons ordered by order_index
  const { data: lessons, error: lesError } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("*")
    .order("order_index", { ascending: true });

  if (lesError) return NextResponse.json({ error: lesError.message }, { status: 500 });

  // Build response with access flags and signed URLs
  const result = await Promise.all(
    (modules ?? []).map(async (mod) => {
      const canAccess = hasAccess(tier, mod.tier as Tier);
      const modLessons = (lessons ?? []).filter((l) => l.module_id === mod.id);

      const lessonsWithUrls = await Promise.all(
        modLessons.map(async (lesson) => {
          let pdf_url: string | null = null;
          if (canAccess && lesson.pdf_path) {
            const { data: signedData } = await supabaseAdmin.storage
              .from("curriculum")
              .createSignedUrl(lesson.pdf_path, 3600);
            pdf_url = signedData?.signedUrl ?? null;
          }
          return {
            id: lesson.id,
            module_id: lesson.module_id,
            title: lesson.title,
            notes: lesson.notes,
            video_id: canAccess ? lesson.video_id : null,
            pdf_path: canAccess ? lesson.pdf_path : null,
            pdf_url,
            order_index: lesson.order_index,
            created_at: lesson.created_at,
          };
        })
      );

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        tier: mod.tier,
        order_index: mod.order_index,
        created_at: mod.created_at,
        canAccess,
        lessons: lessonsWithUrls,
      };
    })
  );

  return NextResponse.json({ tier, modules: result });
}
