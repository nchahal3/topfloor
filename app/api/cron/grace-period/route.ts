import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revokeProRole } from "@/lib/discord-roles";
import type { Tier } from "@/lib/tier";

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
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(clerk_user_id);
      const currentTier = user.publicMetadata?.tier as Tier | null;
      const discordUserId = user.publicMetadata?.discordUserId as string | undefined;

      if (currentTier === "lifetime") {
        await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", clerk_user_id);
        continue;
      }

      if (currentTier) {
        if (discordUserId) await revokeProRole(discordUserId);
        await clerk.users.updateUserMetadata(clerk_user_id, {
          publicMetadata: {
            tier: null,
            suspendedTier: currentTier,
            gracePeriodEnd: null,
            discordUserId: null,
            discordUsername: null,
          },
        });
      }

      await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", clerk_user_id);
      processed.push(clerk_user_id);
    } catch (e) {
      errors.push(`${clerk_user_id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return Response.json({ processed: processed.length, errors });
}
