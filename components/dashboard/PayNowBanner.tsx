"use client";

import Link from "next/link";

export default function PayNowBanner() {
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
      <Link
        href="/dashboard/billing"
        style={{
          background: "#fff", color: "#cc2200", fontWeight: 700,
          fontSize: 13, padding: "6px 18px", borderRadius: 999,
          textDecoration: "none", whiteSpace: "nowrap",
        }}
      >
        Pay Now →
      </Link>
    </div>
  );
}
