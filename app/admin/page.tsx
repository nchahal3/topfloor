import { cookies } from "next/headers";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import LoginForm from "./LoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Member } from "@/components/admin/MembersTab";
import { getAdminToken } from "@/lib/admin-auth";

const PLAN_NAMES: Record<string, string> = {
  price_1TiikP8sHKVNeGWtxjodurtl: "Bronze ($200/mo)",
  price_1Tiike8sHKVNeGWtJr1gxDZx: "Silver ($500/mo)",
  price_1Tiiku8sHKVNeGWtthSeTog0: "Gold ($750/mo)",
  price_1Tiil68sHKVNeGWt4SFHY6P5: "Lifetime ($2,000)",
};

async function getMembers(): Promise<Member[]> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const sessions = await stripe.checkout.sessions.list({ limit: 100, status: "complete" });

  // Deduplicate by email first, then fetch all line items + subscriptions in parallel
  const seen = new Set<string>();
  const uniqueSessions = sessions.data.filter((s) => {
    const email = s.customer_details?.email ?? "";
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  type SubInfo = { status?: string; current_period_end?: number; items?: { data?: Array<{ current_period_end?: number }> } };

  const enriched = await Promise.all(
    uniqueSessions.map(async (session) => {
      const [lineItemsResult, subResult] = await Promise.allSettled([
        stripe.checkout.sessions.listLineItems(session.id),
        session.subscription
          ? stripe.subscriptions.retrieve(session.subscription as string)
          : Promise.resolve(null),
      ]);

      const priceId =
        lineItemsResult.status === "fulfilled"
          ? (lineItemsResult.value.data[0]?.price?.id ?? "")
          : "";
      const planName = PLAN_NAMES[priceId] ?? "Unknown";

      const sub = subResult.status === "fulfilled" ? (subResult.value as unknown as SubInfo) : null;
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

    members.push({
      id: session.id,
      clerkUserId: session.metadata?.clerkUserId ?? null,
      name: session.customer_details?.name ?? "—",
      email,
      phone: session.customer_details?.phone ?? "—",
      discord,
      plan: planName,
      status: session.mode === "payment" ? "lifetime" : status,
      nextPayment,
      joinedAt: new Date(session.created * 1000).toLocaleDateString("en-CA", {
        month: "short", day: "numeric", year: "numeric",
      }),
      subscriptionId: session.mode === "payment" ? null : (session.subscription as string | null) ?? null,
    });
  }

  // Add free Clerk users (signed up but never paid)
  try {
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({ limit: 500 });
    const paidEmails = new Set(members.map((m) => m.email.toLowerCase()));

    for (const user of clerkUsers.data) {
      const email = user.emailAddresses[0]?.emailAddress ?? "";
      if (!email || paidEmails.has(email.toLowerCase())) continue;

      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";

      members.push({
        id: user.id,
        clerkUserId: user.id,
        name: fullName,
        email,
        phone: user.phoneNumbers[0]?.phoneNumber ?? "—",
        discord: (user.publicMetadata?.discord as string) ?? "—",
        plan: "Free",
        status: "free",
        nextPayment: "—",
        joinedAt: new Date(user.createdAt).toLocaleDateString("en-CA", {
          month: "short", day: "numeric", year: "numeric",
        }),
        subscriptionId: null,
      });
    }
  } catch {}

  return members;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get("admin_auth")?.value === getAdminToken();

  if (!isAuth) return <LoginForm />;

  const members = await getMembers();
  return <AdminDashboard members={members} />;
}
