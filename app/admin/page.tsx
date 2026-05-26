import { cookies } from "next/headers";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import LoginForm from "./LoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Member } from "@/components/admin/MembersTab";
import { getAdminToken } from "@/lib/admin-auth";

const PLAN_NAMES: Record<string, string> = {
  price_1TRIBdRxClGX2uTFE404PcWF: "Bronze ($200/mo)",
  price_1TPYX3RxClGX2uTFzwnMHkP2: "Silver ($500/mo)",
  price_1TPYXsRxClGX2uTFcMCkSlMo: "Gold ($750/mo)",
  price_1TPYYGRxClGX2uTF7o1v901o: "Elite Lifetime ($2,000)",
};

async function getMembers(): Promise<Member[]> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const sessions = await stripe.checkout.sessions.list({ limit: 100, status: "complete" });

  const seen = new Set<string>();
  const members: Member[] = [];

  for (const session of sessions.data) {
    const email = session.customer_details?.email ?? "";
    if (!email || seen.has(email)) continue;
    seen.add(email);

    let planName = "Unknown";
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id ?? "";
      planName = PLAN_NAMES[priceId] ?? "Unknown";
    } catch {}

    let status = "paid";
    let nextPayment = "—";
    if (session.subscription) {
      try {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as {
          status?: string;
          current_period_end?: number;
          items?: { data?: Array<{ current_period_end?: number }> };
        };
        status = sub.status ?? "active";
        const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
        if (periodEnd) {
          const d = new Date(Number(periodEnd) * 1000);
          if (!isNaN(d.getTime())) {
            nextPayment = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          }
        }
      } catch {}
    }

    const discord =
      session.custom_fields?.find((f) => f.key === "discord_username")?.text?.value ?? "—";

    members.push({
      id: session.id,
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
