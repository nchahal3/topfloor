import { supabaseAdmin } from "@/lib/supabase";
import { lockUser } from "@/lib/grace-lock";

// Backstop for the QStash delayed-revoke job: sweeps any expired grace periods
// that a scheduled job missed (e.g. QStash unconfigured or a dropped message).
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: expired, error } = await supabaseAdmin
    .from("grace_periods")
    .select("clerk_user_id")
    .lt("expires_at", new Date().toISOString());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const processed: string[] = [];
  const errors: string[] = [];

  for (const { clerk_user_id } of expired ?? []) {
    try {
      await lockUser(clerk_user_id);
      processed.push(clerk_user_id);
    } catch (e) {
      errors.push(`${clerk_user_id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return Response.json({ processed: processed.length, errors });
}
