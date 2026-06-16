import { cookies } from "next/headers";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import LoginForm from "./LoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Member } from "@/components/admin/MembersTab";
import { getAdminToken } from "@/lib/admin-auth";

const PLAN_NAMES: Record<string, string> = {
  price_1TiphA8U0Yle7MZgUELrqhSV: "Bronze ($200/mo)",
  price_1TiphA8U0Yle7MZggKFKtsl8: "Silver ($500/mo)",
  price_1TiphA8U0Yle7MZgkmDxN3lZ: "Gold ($750/mo)",
  price_1TiphC8U0Yle7MZg1ivchT6j: "Lifetime ($2,000)",
};

async function getMembers(): Promise<Member[]> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Fetch all Clerk users first so we can cross-reference current tier for every member
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });
  const clerkByEmail = new Map(
    clerkUsers.data.map((u) => [
      (u.emailAddresses[0]?.emailAddress ?? "").toLowerCase(),
      {
        clerkTier: (u.publicMetadata?.tier as string | null) ?? null,
        clerkUserId: u.id,
        phone: u.phoneNumbers[0]?.phoneNumber ?? "—",
        discord: (u.publicMetadata?.discord as string) ?? "—",
        joinedAt: new Date(u.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }),
        fullName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
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

      const sub = subResult.status === "fulfilled" ? (subResult.value as unknown as SubInfo) : null;

      // Prefer live subscription price (reflects admin tier changes); fall back to original checkout
      const priceId =
        sub?.items?.data?.[0]?.price?.id
        ?? (lineItemsResult.status === "fulfilled"
          ? (lineItemsResult.value.data[0]?.price?.id ?? "")
          : "");
      const planName = PLAN_NAMES[priceId] ?? "Unknown";

      const status = sub?.status ?? "paid";
      let nextPayment = "—";
      const periodEnd = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end;
      if (periodEnd) {
        const d = new Date(Number(periodEnd) * 1000);
        if (!isNaN(d.getTime())) {
          nextPayment = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      }

      return { session, planName, status, nextPayment };
    })
  );

  const members: Member[] = [];
  for (const { session, planName, status, nextPayment } of enriched) {
    const email = session.customer_details?.email ?? "";
    const discord =
      session.custom_fields?.find((f) => f.key === "discord_username")?.text?.value ?? "—";
    const clerkData = clerkByEmail.get(email.toLowerCase());
    const clerkTier = clerkData?.clerkTier ?? null;

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
      clerkUserId: session.metadata?.clerkUserId ?? clerkData?.clerkUserId ?? null,
      clerkTier,
      name: session.customer_details?.name ?? "—",
      email,
      phone: session.customer_details?.phone ?? "—",
      discord,
      plan: planName,
      status: effectiveStatus,
      nextPayment,
      joinedAt: new Date(session.created * 1000).toLocaleDateString("en-CA", {
        month: "short", day: "numeric", year: "numeric",
      }),
      subscriptionId: session.mode === "payment" ? null : (session.subscription as string | null) ?? null,
    });
  }

  // Add free Clerk users (signed up but never paid)
  const paidEmails = new Set(members.map((m) => m.email.toLowerCase()));
  for (const [email, data] of clerkByEmail) {
    if (!email || paidEmails.has(email)) continue;
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
      nextPayment: "—",
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
