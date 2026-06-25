"use client";

import { useState } from "react";

export default function PayNowBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayNow() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/pay-outstanding", { method: "POST" });
      const { url, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "linear-gradient(90deg, #cc2200, #ff3311)",
      padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
      flexWrap: "wrap",
    }}>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
        ⚠️ Your access is paused — a payment failed on your account.
      </span>
      <button
        onClick={handlePayNow}
        disabled={loading}
        style={{
          background: "#fff", color: "#cc2200", fontWeight: 700,
          fontSize: 13, padding: "6px 18px", borderRadius: 999,
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, whiteSpace: "nowrap",
        }}
      >
        {loading ? "Loading..." : "Pay Now →"}
      </button>
      {error && <span style={{ color: "#ffcccc", fontSize: 13 }}>{error}</span>}
    </div>
  );
}
