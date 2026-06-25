"use client";

import { useState } from "react";
import type { Tier } from "@/lib/tier";

const PLANS: { tier: Tier; label: string; price: string; features: string[] }[] = [
  {
    tier: "bronze",
    label: "Bronze",
    price: "$200/mo",
    features: ["Live trading alerts", "Private Discord access", "Weekly group sessions"],
  },
  {
    tier: "silver",
    label: "Silver",
    price: "$500/mo",
    features: ["Everything in Bronze", "Daily market breakdowns", "Priority Discord support"],
  },
  {
    tier: "gold",
    label: "Gold",
    price: "$750/mo",
    features: ["Everything in Silver", "1-on-1 monthly mentorship call", "VIP trade setups"],
  },
];

export default function ChangePlanSection({ currentTier }: { currentTier: Tier }) {
  const [loading, setLoading] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function switchPlan(plan: Tier) {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 16px" }}>
        CHANGE PLAN
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {PLANS.map(({ tier, label, price, features }) => {
          const isCurrent = tier === currentTier;
          const isLoading = loading === tier;
          return (
            <div
              key={tier}
              style={{
                padding: "18px 20px",
                borderRadius: 14,
                background: isCurrent ? "rgba(0,255,136,0.06)" : "rgba(255,255,255,0.03)",
                border: isCurrent ? "1px solid rgba(0,255,136,0.35)" : "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "border-color 0.2s",
              }}
            >
              <div>
                <p style={{ color: isCurrent ? "#00ff88" : "#f5f5f5", fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>
                  {label}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>{price}</p>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", listStyle: "disc" }}>
                {features.map((f) => (
                  <li key={f} style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7 }}>{f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <span
                  style={{
                    marginTop: 4,
                    padding: "7px 14px",
                    borderRadius: 8,
                    background: "rgba(0,255,136,0.12)",
                    color: "#00ff88",
                    fontWeight: 700,
                    fontSize: 12,
                    textAlign: "center",
                    letterSpacing: "0.04em",
                  }}
                >
                  Current Plan
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() => switchPlan(tier)}
                  style={{
                    marginTop: 4,
                    padding: "7px 14px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 600,
                    fontSize: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading && !isLoading ? 0.5 : 1,
                    transition: "background 0.2s",
                  }}
                >
                  {isLoading ? "Switching…" : `Switch to ${label}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p style={{ color: "#ff4444", fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  );
}
