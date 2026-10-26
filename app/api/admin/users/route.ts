import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { revokeProRole } from "@/lib/discord-roles";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

// Pulls a human-readable reason out of a Clerk API error (status + first error detail).
function clerkErrorDetail(err: unknown): { status?: number; detail: string } {
  const e = err as { status?: number; errors?: Array<{ message?: string; longMessage?: string }> };
  const status = typeof e?.status === "number" ? e.status : undefined;
  const detail =
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    (err instanceof Error ? err.message : String(err));
  return { status, detail };
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json() as { clerkUserId?: string; email?: string };
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const clerk = await clerkClient();
  const normalizedEmail = email.toLowerCase();

  let clerkDeleted = false;
  let subsCancelled = 0;

  // 1. Delete the Clerk account in THIS instance (if present); revoke Discord first.
  //    A missing account is fine - the member may be Stripe-only or live in another env.
  try {
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    const user = users.data[0];
    if (user) {
      const discordUserId = user.publicMetadata?.discordUserId as string | undefined;
      if (discordUserId) await revokeProRole(discordUserId);
      await clerk.users.deleteUser(user.id);
      clerkDeleted = true;
      await supabaseAdmin.from("grace_periods").delete().eq("clerk_user_id", user.id);
    }
  } catch (err) {
    const { status, detail } = clerkErrorDetail(err);
    if (status !== 404) {
      console.error("Delete user (Clerk) error:", err);
      return NextResponse.json({ error: `Failed to delete Clerk account: ${detail}` }, { status: 500 });
    }
    // 404 → no account in this instance; continue with Stripe cleanup + blocklist.
  }

  // 2. Cancel any live Stripe subscriptions for this customer so billing stops.
  try {
    const customers = await stripe.customers.list({ email, limit: 10 });
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 100 });
      for (const sub of subs.data) {
        if (sub.status !== "canceled" && sub.status !== "incomplete_expired") {
          await stripe.subscriptions.cancel(sub.id);
          subsCancelled++;
        }
      }
    }
  } catch (err) {
    console.error("Delete user (Stripe) error:", err);
    return NextResponse.json(
      { error: `Removed access but failed to cancel Stripe subscription: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  // 3. Record the deletion. The admin list is built from immutable Stripe checkout
  //    sessions, so without this a paid member reappears on reload. Cleared automatically
  //    if they ever re-subscribe (see checkout.session.completed in the webhook).
  try {
    await supabaseAdmin
      .from("deleted_members")
      .upsert({ email: normalizedEmail, deleted_at: new Date().toISOString() });
  } catch (err) {
    console.error("Delete user (blocklist) error:", err);
    return NextResponse.json(
      { error: `Removed access but failed to hide from list: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, clerkDeleted, subsCancelled });
}
