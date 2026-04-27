import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { TrendingUp, BookOpen, Trophy, Calendar, Video, ArrowRight } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { TIER_LABELS, TIER_COLORS } from "@/lib/tier";

const FEATURE_CARDS = [
  { label: "Funded Accounts", desc: "Promo codes for Alpha Futures, Lucid & more", href: "/dashboard/funded-accounts", icon: TrendingUp, free: true },
  { label: "Curriculum", desc: "Coach Floor's full trading breakdown sessions", href: "/dashboard/curriculum", icon: BookOpen, free: false },
  { label: "Achievements", desc: "Upload your certificates & payout requests", href: "/dashboard/achievements", icon: Trophy, free: true },
  { label: "Book a Call", desc: "Schedule a 1-on-1 coaching or trade review", href: "/dashboard/book-a-call", icon: Calendar, free: true },
  { label: "Upcoming Classes", desc: "Live trading sessions & class schedule", href: "/dashboard/upcoming-classes", icon: Video, free: false },
];

export default async function DashboardPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const name = user?.firstName ?? "Trader";

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1
          className="display-font"
          style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}
        >
          Welcome back, {name}.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15 }}>
          Your trading dashboard — everything you need in one place.
        </p>
      </div>

      {/* Plan status */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          marginBottom: 40,
          background: tier ? `${TIER_COLORS[tier]}0d` : "rgba(255,255,255,0.03)",
          border: `1px solid ${tier ? `${TIER_COLORS[tier]}30` : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: 0 }}>
            CURRENT PLAN
          </p>
          <p
            style={{
              color: tier ? TIER_COLORS[tier] : "#f5f5f5",
              fontSize: 20,
              fontWeight: 700,
              margin: "6px 0 0",
            }}
          >
            {tier ? `${TIER_LABELS[tier]} Member` : "Free Account"}
          </p>
          {!tier && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "4px 0 0" }}>
              Upgrade to unlock live trades, curriculum, and more.
            </p>
          )}
        </div>
        {!tier && (
          <Link
            href="/#pricing"
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              background: "#00ff88",
              color: "#000",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View Plans →
          </Link>
        )}
      </div>

      {/* Feature grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          const locked = !card.free && !tier;
          return (
            <Link
              key={card.href}
              href={card.href}
              style={{
                display: "block",
                padding: "20px",
                borderRadius: 16,
                background: "#111",
                border: "1px solid rgba(255,255,255,0.06)",
                textDecoration: "none",
                opacity: locked ? 0.6 : 1,
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(0,255,136,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} style={{ color: "#00ff88" }} />
                </div>
                {card.free ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                    FREE
                  </span>
                ) : locked ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                    LOCKED
                  </span>
                ) : null}
              </div>
              <p style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>{card.label}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14, color: locked ? "rgba(255,255,255,0.2)" : "#00ff88" }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{locked ? "Upgrade to unlock" : "Open"}</span>
                <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
