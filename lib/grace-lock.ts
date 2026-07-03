import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revokeProRole } from "@/lib/discord-roles";
import { sendDiscordLog } from "@/lib/discord";
import { Resend } from "resend";
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

  // Notify member and log to Discord
  const memberEmail = user.emailAddresses?.[0]?.emailAddress;
  const memberName = user.firstName ?? "Member";
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://www.topfloortradesofficial.com";
  const planLabel = currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : "your";

  sendDiscordLog({
    title: "🔒 Member Access Locked",
    color: 0xff4444,
    fields: [
      { name: "Name", value: memberName, inline: true },
      { name: "Plan", value: planLabel, inline: true },
      { name: "Email", value: memberEmail ?? "unknown", inline: false },
    ],
    description: "Grace period expired without payment. Access and Discord Pro role removed.",
  });

  if (memberEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await Promise.all([resend.emails.send({
      from: "TopFloor <noreply@topfloortradesofficial.com>",
      to: memberEmail,
      subject: "Your TopFloor access has been paused",
      text: `Hey ${memberName},\n\nYour TopFloor ${planLabel} membership access has been paused because your payment couldn't be processed.\n\nYou can restore access immediately by updating your payment method:\n${baseUrl}/dashboard/billing\n\nYour membership history is saved - once you update your card, everything is restored instantly.\n\n---\nTrading involves significant risk. Past performance is not indicative of future results.`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;border:1px solid rgba(255,68,68,0.3);">
          <h2 style="color:#ff4444;margin-top:0;">Your access has been paused</h2>
          <p style="color:#aaa;line-height:1.6;">Hey ${memberName}, your TopFloor <strong style="color:#f5f5f5;">${planLabel}</strong> membership has been paused because your payment couldn't be processed within the grace period.</p>
          <p style="color:#aaa;line-height:1.6;">Your membership history is saved - update your payment method and everything is restored instantly.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${baseUrl}/dashboard/billing" style="display:inline-block;background:#00ff88;color:#000;font-weight:bold;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:16px;">
              Restore Access Now
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
          <p style="color:#444;font-size:11px;">Trading involves significant risk. Past performance is not indicative of future results.</p>
        </div>
      `,
    }),
    resend.emails.send({
      from: "TopFloor <noreply@topfloortradesofficial.com>",
      to: process.env.COACH_EMAIL!,
      subject: `🔒 Member Access Locked - ${memberName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
          <h2 style="color:#ff4444;margin-top:0;">Member Access Locked</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${memberName}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${memberEmail}" style="color:#00ff88;">${memberEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#999;">Plan</td><td style="padding:8px 0;color:#ffa500;">${planLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Status</td><td style="padding:8px 0;color:#ff4444;">Access removed - grace period expired</td></tr>
          </table>
        </div>
      `,
    }),
    ]).catch(() => {});
  }

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
