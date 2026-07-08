import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { AchievementRow } from "@/lib/supabase";

// Public endpoint powering the Results carousel (components/FundedWins.tsx).
// Returns ONLY achievements an admin has explicitly marked `featured` (which
// requires them to already be approved). Images live in the private
// `achievements` bucket, so we hand back short-lived signed URLs rather than
// exposing the bucket publicly.

export const revalidate = 300; // cache 5 min - signed URLs live 1h so this is safe

const CATEGORY_LABELS: Record<string, string> = {
  evaluation_pass: "Evaluation Pass",
  payout_request: "Payout",
  account_milestone: "Account Milestone",
  funded_account: "Funded Account",
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("achievements")
    .select("id, member_name, category, notes, review_quote, review_role, file_path, featured_order, created_at")
    .eq("featured", true)
    .eq("status", "approved")
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Pick<
    AchievementRow,
    "id" | "member_name" | "category" | "notes" | "review_quote" | "review_role" | "file_path" | "featured_order" | "created_at"
  >[];

  const results = await Promise.all(
    rows.map(async (r) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("achievements")
        .createSignedUrl(r.file_path, 3600);
      if (!signed?.signedUrl) return null;

      const firstName = r.member_name?.split(" ")[0] ?? "Member";
      const label = r.notes?.trim()
        || (r.member_name
          ? `${CATEGORY_LABELS[r.category] ?? "Verified"} - ${firstName}`
          : CATEGORY_LABELS[r.category] ?? "Verified Win");

      return {
        id: r.id,
        src: signed.signedUrl,
        label,
        name: firstName,
        quote: r.review_quote,
        role: r.review_role,
      };
    })
  );

  return NextResponse.json(results.filter((r) => r !== null));
}
