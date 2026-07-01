import { cookies } from "next/headers";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import LoginForm from "./LoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Member } from "@/components/admin/MembersTab";
import { getAdminToken } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

// Maps Clerk tier → display name (used when admin manually changes a member's tier)
const TIER_PLAN_NAMES: Record<string, string> = {
  bronze: "Bronze ($200/mo)",
  silver: "Silver ($500/mo)",
  gold: "Gold ($750/mo)",
  lifetime: "Lifetime ($2,000)",
};

const PLAN_NAMES: Record<string, string> = {
  price_1TiphA8U0Yle7MZgUELrqhSV: "Bronze ($200/mo)",
  price_1TiphA8U0Yle7MZggKFKtsl8: "Silver ($500/mo)",
  price_1TiphA8U0Yle7MZgkmDxN3lZ: "Gold ($750/mo)",
  price_1TiphC8U0Yle7MZg1ivchT6j: "Lifetime ($2,000)",
  price_1TiikP8sHKVNeGWtxjodurtl: "Bronze ($200/mo)",
  price_1Tiike8sHKVNeGWtJr1gxDZx: "Silver ($500/mo)",
  price_1Tiiku8sHKVNeGWtthSeTog0: "Gold ($750/mo)",
  price_1Tiil68sHKVNeGWt4SFHY6P5: "Lifetime ($2,000)",
};

async function getMembers(): Promise<Member[]> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Members deleted by an admin, keyed by email → deletion time. The list is built from
  // immutable Stripe checkout sessions, so this is what keeps a deleted member from
  // reappearing on reload. It's time-aware: we only hide records that existed BEFORE the
  // deletion, so if the same person signs up again (free OR paid) that newer account shows
  // up normally as a brand-new member.
  const { data: deletedRows } = await supabaseAdmin.from("deleted_members").select("email, deleted_at");
  const deletedAtByEmail = new Map(
    (deletedRows ?? []).map((r) => [(r.email as string).toLowerCase(), new Date(r.deleted_at as string).getTime()]),
  );
  // True if this email was deleted AND the given record predates that deletion (so it's the
  // stale record we should hide, not a fresh re-signup).
  const isStaleDeleted = (email: string, recordMs: number) => {
    const delAt = deletedAtByEmail.get(email.toLowerCase());
    return delAt !== undefined && recordMs <= delAt;
  };

  // Fetch all Clerk users first so we can cross-reference current tier for every member
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });
  const clerkByEmail = new Map(
    clerkUsers.data.map((u) => [
      (u.emailAddresses[0]?.emailAddress ?? "").toLowerCase(),
      {
        clerkTier: (u.publicMetadata?.tier as string | null) ?? null,
        clerkUserId: u.id,
        phone: u.phoneNumbers[0]?.phoneNumber ?? "-",
        discord: (u.publicMetadata?.discordUsername as string) ?? null,
        createdAtMs: u.createdAt,
        joinedAt: new Date(u.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }),
        fullName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "-",
      },
    ])
  );

  const sessions = await stripe.checkout.sessions.list({ limit: 100, status: "complete" });

  // Deduplicate by email first, then fetch all line items + subscriptions in parallel
  const seen = new Set<string>();
  const uniqueSessions = sessions.data.filter((s) => {
    const email = s.customer_details?.email ?? "";
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  type SubInfo = { status?: string; current_period_end?: number; items?: { data?: Array<{ current_period_end?: number; price?: { id?: string } }> } };

  const enriched = await Promise.all(
    uniqueSessions.map(async (session) => {
      const [lineItemsResult, subResult] = await Promise.allSettled([
        stripe.checkout.sessions.listLineItems(session.id),
        session.subscription
          ? stripe.subscriptions.retrieve(session.subscription as string)
          : Promise.resolve(null),
      ]);

      let sub = subResult.status === "fulfilled" ? (subResult.value as unknown as SubInfo) : null;
      let activeSubId: string | null = session.subscription as string | null;

      // If session subscription is cancelled, look for a newer active subscription on the customer
      if (sub?.status === "canceled" && session.customer) {
        try {
          const activeSubs = await stripe.subscriptions.list({
            customer: session.customer as string,
            status: "active",
            limit: 1,
          });
          if (activeSubs.data.length > 0) {
            sub = activeSubs.data[0] as unknown as SubInfo;
            activeSubId = activeSubs.data[0].id;
          }
        } catch {}
      }

      // Prefer live subscription price (reflects admin tier changes); fall back to original checkout
      const priceId =
        sub?.items?.data?.[0]?.price?.id
        ?? (lineItemsResult.status === "fulfilled"
          ? (lineItemsResult.value.data[0]?.price?.id ?? "")
          : "");
      const planName = PLAN_NAMES[priceId] ?? "Unknown";

      const status = sub?.status ?? "paid";
      let nextPayment = "-";
      const periodEnd = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end;
      if (periodEnd) {
        const d = new Date(Number(periodEnd) * 1000);
        if (!isNaN(d.getTime())) {
          nextPayment = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      }

      return { session, planName, status, nextPayment, activeSubId };
    })
  );

  const members: Member[] = [];
  for (const { session, planName, status, nextPayment, activeSubId } of enriched) {
    const email = session.customer_details?.email ?? "";
    // Hide a checkout session that predates an admin deletion (stale record). A newer
    // session for the same email (re-subscribe) survives and shows up.
    if (isStaleDeleted(email, session.created * 1000)) continue;
    const clerkData = clerkByEmail.get(email.toLowerCase());
    // Always prefer OAuth-verified Clerk username; falls to "-" when disconnected
    const discord = clerkData?.discord ?? "-";
    const clerkTier = clerkData?.clerkTier ?? null;
    // Use clerkTier as source of truth for plan name (reflects admin tier changes)
    const displayPlan = clerkTier ? (TIER_PLAN_NAMES[clerkTier] ?? planName) : planName;

    // Derive effective status from Clerk (source of truth for access)
    // Keep Stripe failure states (canceled/past_due) regardless of Clerk
    const stripeStatus = session.mode === "payment" ? "lifetime" : status;
    const effectiveStatus = (() => {
      if (stripeStatus === "canceled" || stripeStatus === "past_due") return stripeStatus;
      if (clerkTier === "lifetime") return "lifetime";
      if (clerkTier) return "active";
      return "free"; // null clerkTier = no access, even if they paid
    })();

    members.push({
      id: session.id,
      clerkUserId: clerkData?.clerkUserId ?? session.metadata?.clerkUserId ?? null,
      clerkTier,
      name: session.customer_details?.name ?? "-",
      email,
      phone: session.customer_details?.phone ?? "-",
      discord,
      plan: displayPlan,
      status: effectiveStatus,
      nextPayment,
      joinedAt: new Date(session.created * 1000).toLocaleDateString("en-CA", {
        month: "short", day: "numeric", year: "numeric",
      }),
      subscriptionId: session.mode === "payment" ? null : activeSubId,
    });
  }

  // Add free Clerk users (signed up but never paid)
  const paidEmails = new Set(members.map((m) => m.email.toLowerCase()));
  for (const [email, data] of clerkByEmail) {
    // Skip if already listed via Stripe, or if this is the stale Clerk account that existed
    // before an admin deletion. A re-signup creates a newer account → createdAtMs is after
    // the deletion → shown as a brand-new free member.
    if (!email || paidEmails.has(email) || isStaleDeleted(email, data.createdAtMs)) continue;
    members.push({
      id: data.clerkUserId,
      clerkUserId: data.clerkUserId,
      clerkTier: data.clerkTier,
      name: data.fullName,
      email,
      phone: data.phone,
      discord: data.discord,
      plan: data.clerkTier ? (data.clerkTier.charAt(0).toUpperCase() + data.clerkTier.slice(1)) : "Free",
      status: data.clerkTier === "lifetime" ? "lifetime" : data.clerkTier ? "active" : "free",
      nextPayment: "-",
      joinedAt: data.joinedAt,
      subscriptionId: null,
    });
  }

  return members;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get("admin_auth")?.value === getAdminToken();

  if (!isAuth) return <LoginForm />;

  const members = await getMembers();
  return <AdminDashboard members={members} />;
}
