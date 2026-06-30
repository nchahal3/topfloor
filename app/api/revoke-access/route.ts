import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { revokeIfGraceExpired } from "@/lib/grace-lock";

/**
 * Authorizes a revoke request from either:
 *  - QStash (signed with the Upstash signing keys), the normal production path, or
 *  - a manual/cron-style call carrying `Authorization: Bearer <CRON_SECRET>`,
 *    used for testing and as a backstop.
 */
async function authorize(request: Request, body: string): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (auth && process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  const signature = request.headers.get("upstash-signature");
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (signature && currentSigningKey && nextSigningKey) {
    try {
      const receiver = new Receiver({ currentSigningKey, nextSigningKey });
      return await receiver.verify({ signature, body });
    } catch {
      return false;
    }
  }

  return false;
}

export async function POST(request: Request) {
  const body = await request.text();

  if (!(await authorize(request, body))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clerkUserId: string | undefined;
  try {
    clerkUserId = (JSON.parse(body || "{}") as { clerkUserId?: string }).clerkUserId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!clerkUserId) {
    return NextResponse.json({ error: "clerkUserId required" }, { status: 400 });
  }

  try {
    const result = await revokeIfGraceExpired(clerkUserId);
    return NextResponse.json({ clerkUserId, result });
  } catch (e) {
    console.error("[revoke-access] failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
