import { cookies } from "next/headers";
import Stripe from "stripe";
import LoginForm from "./LoginForm";

const PLAN_NAMES: Record<string, string> = {
  price_1TPYX3RxClGX2uTFzwnMHkP2: "Foundation ($500/mo)",
  price_1TPYXsRxClGX2uTFcMCkSlMo: "Elite Mentorship ($750/mo)",
  price_1TPYYGRxClGX2uTF7o1v901o: "Elite Lifetime ($2,000)",
};

async function getMembers() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    status: "complete",
  });

  const seen = new Set<string>();
  const members = [];

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
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        status = sub.status;
        nextPayment = new Date(sub.current_period_end * 1000).toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
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
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
  }

  return members;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:   { bg: "rgba(0,255,136,0.15)", color: "#00ff88" },
  lifetime: { bg: "rgba(240,192,64,0.15)", color: "#f0c040" },
  canceled: { bg: "rgba(255,68,68,0.15)",  color: "#ff4444" },
  past_due: { bg: "rgba(255,165,0,0.15)",  color: "#ffa500" },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;

  if (!isAuth) return <LoginForm />;

  const members = await getMembers();

  const headers = ["Name", "Email", "Discord", "Phone", "Plan", "Status", "Next Payment", "Joined"];

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 52, margin: 0 }}>
              🔝Floor Members
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 14 }}>
              {members.length} member{members.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <a
            href="/api/admin/logout"
            style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textDecoration: "none", marginTop: 8 }}
          >
            Logout
          </a>
        </div>

        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                {headers.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 18px",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.35)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      letterSpacing: "0.05em",
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const s = STATUS_STYLE[m.status] ?? STATUS_STYLE.active;
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "#0a0a0a" : "#0d0d0d",
                    }}
                  >
                    <td style={{ padding: "14px 18px", color: "#f5f5f5", fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: "14px 18px", color: "#00ff88" }}>{m.email}</td>
                    <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.65)" }}>{m.discord}</td>
                    <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.65)" }}>{m.phone}</td>
                    <td style={{ padding: "14px 18px", color: "#f0c040", fontWeight: 600 }}>{m.plan}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.55)" }}>{m.nextPayment}</td>
                    <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.35)" }}>{m.joinedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {members.length === 0 && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "60px 0" }}>
              No members yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
