"use client";

import { useState } from "react";
import type { Tier } from "@/lib/tier";

const PLANS: { tier: Tier; label: string; price: string; features: string[]; lifetime?: boolean }[] = [
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
  {
    tier: "lifetime",
    label: "Lifetime",
    price: "$2,000 one-time",
    features: ["Everything in Gold", "Never pay again", "Permanent access forever"],
    lifetime: true,
  },
];

const TIER_AMOUNTS: Record<string, string> = {
  bronze: "$200/mo",
  silver: "$500/mo",
  gold: "$750/mo",
  lifetime: "$2,000 one-time",
};

export default function ChangePlanSection({ currentTier }: { currentTier: Tier }) {
  const [confirming, setConfirming] = useState<{ tier: Tier; label: string; price: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmSwitch() {
    if (!confirming) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: confirming.tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong");
        setConfirming(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setConfirming(null);
    } finally {
      setLoading(false);
    }
  }

  const currentPlan = PLANS.find((p) => p.tier === currentTier);

  return (
    <>
      {/* Confirmation modal */}
      {confirming && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 16px",
          }}
          onClick={() => { if (!loading) setConfirming(null); }}
        >
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "28px 28px 24px",
              maxWidth: 400,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {confirming.tier === "lifetime" ? (
              <>
                <h3 style={{ color: "#f0c040", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Upgrade to Lifetime</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>
                  You&apos;ll be charged a <strong style={{ color: "#f0c040" }}>one-time $2,000 payment</strong> via Stripe checkout.
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
                  Your current monthly subscription will be <strong style={{ color: "#f5f5f5" }}>cancelled automatically</strong>{" "}once payment is complete. You&apos;ll never be charged again.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Confirm plan change</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>
                  You&apos;re switching from{" "}
                  <strong style={{ color: "#f5f5f5" }}>{currentPlan?.label} ({currentTier ? TIER_AMOUNTS[currentTier] : ""})</strong>{" "}
                  to <strong style={{ color: "#00ff88" }}>{confirming.label} ({confirming.price})</strong>.
                  <br />
                  <span style={{ fontSize: 13 }}>The change takes effect immediately and your billing will be prorated.</span>
                </p>
              </>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={confirmSwitch}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  background: confirming.tier === "lifetime" ? "#f0c040" : "#00ff88",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Processing…" : confirming.tier === "lifetime" ? "Proceed to Payment" : "Confirm Switch"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 16px" }}>
          CHANGE PLAN
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {PLANS.map(({ tier, label, price, features, lifetime: isLifetime }) => {
            const isCurrent = tier === currentTier;
            const cardBg = isCurrent ? "rgba(0,255,136,0.06)" : isLifetime ? "rgba(240,192,64,0.04)" : "rgba(255,255,255,0.03)";
            const cardBorder = isCurrent ? "1px solid rgba(0,255,136,0.35)" : isLifetime ? "1px solid rgba(240,192,64,0.25)" : "1px solid rgba(255,255,255,0.08)";
            const labelColor = isCurrent ? "#00ff88" : isLifetime ? "#f0c040" : "#f5f5f5";
            return (
              <div key={tier} style={{ padding: "18px 20px", borderRadius: 14, background: cardBg, border: cardBorder, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <p style={{ color: labelColor, fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>{label}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>{price}</p>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", listStyle: "disc" }}>
                  {features.map((f) => (
                    <li key={f} style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7 }}>{f}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <span style={{ marginTop: 4, padding: "7px 14px", borderRadius: 8, background: "rgba(0,255,136,0.12)", color: "#00ff88", fontWeight: 700, fontSize: 12, textAlign: "center", letterSpacing: "0.04em" }}>
                    Current Plan
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming({ tier, label, price })}
                    style={{
                      marginTop: 4, padding: "7px 14px", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer",
                      background: isLifetime ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.08)",
                      color: isLifetime ? "#f0c040" : "rgba(255,255,255,0.7)",
                      border: isLifetime ? "1px solid rgba(240,192,64,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {isLifetime ? "Upgrade to Lifetime" : `Switch to ${label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {error && <p style={{ color: "#ff4444", fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>
    </>
  );
}
