import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revokeProRole } from "@/lib/discord-roles";
import type { Tier } from "@/lib/tier";

/**
 * Locks a single member whose 24h payment grace period has ended:
 * revokes their Discord Pro role and downgrades them to no access, while
 * preserving their old tier in `suspendedTier` for one-click recovery.
 *
 * Used by both the nightly cron (backstop) and the QStash delayed job
 * (fires precisely at grace + 24h). Safe to call more than once.
 */
export async function lockUser(clerkUserId: string): Promise<"locked" | "skipped_lifetime"> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const currentTier = user.publicMetadata?.tier as Tier | null;
  const discordUserId = user.publicMetadata?.discordUserId as string | undefined;

  if (currentTier === "lifetime") {
    await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", clerkUserId);
    return "skipped_lifetime";
  }

  if (currentTier) {
    if (discordUserId) await revokeProRole(discordUserId);
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        tier: null,
        suspendedTier: currentTier,
        gracePeriodEnd: null,
        discordUserId: null,
        discordUsername: null,
      },
    });
  }

  await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", clerkUserId);
  return "locked";
}

/**
 * Checks whether the user's grace period row still exists and has expired,
 * then locks them. No-ops if they already paid (row removed by invoice.paid)
 * or the deadline hasn't passed yet. Used by the QStash delayed-revoke job so
 * a scheduled lock never fires against a member who recovered in time.
 */
export async function revokeIfGraceExpired(
  clerkUserId: string,
): Promise<"locked" | "skipped_lifetime" | "skipped_paid" | "skipped_not_expired"> {
  const { data: row } = await supabaseAdmin
    .from("grace_periods")
    .select("expires_at")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (!row) return "skipped_paid";
  if (new Date(row.expires_at as string) > new Date()) return "skipped_not_expired";

  return await lockUser(clerkUserId);
}
