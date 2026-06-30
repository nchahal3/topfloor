import { Client } from "@upstash/qstash";

const GRACE_SECONDS = 24 * 60 * 60;

/**
 * Schedules a one-off job to lock the member exactly 24h from now — the moment
 * their payment grace period ends. QStash calls POST /api/revoke-access at that
 * time, which re-checks the grace row and revokes Discord + access if still unpaid.
 *
 * No-ops if QStash isn't configured (QSTASH_TOKEN / NEXT_PUBLIC_URL missing); the
 * hourly cron is the backstop in that case. Never throws — a scheduling failure
 * must not break the payment_failed webhook.
 */
export async function scheduleGraceRevoke(clerkUserId: string): Promise<void> {
  const token = process.env.QSTASH_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_URL;
  if (!token || !baseUrl) return;

  try {
    const qstash = new Client({ token });
    await qstash.publishJSON({
      url: `${baseUrl}/api/revoke-access`,
      body: { clerkUserId },
      delay: GRACE_SECONDS,
    });
  } catch (err) {
    console.error("[qstash] failed to schedule grace revoke:", err);
  }
}
