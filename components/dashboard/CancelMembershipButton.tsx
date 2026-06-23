"use client";

import { useState } from "react";

export default function CancelMembershipButton({ cancelAt }: { cancelAt: string | null }) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [cancelDate, setCancelDate] = useState<string | null>(cancelAt);

  const formattedDate = cancelDate
    ? new Date(cancelDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  async function confirm() {
    setStep("loading");
    try {
      const res = await fetch("/api/subscription/cancel", { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setCancelDate(data.cancelAt);
        setStep("done");
      } else {
        setStep("confirm");
        alert(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStep("confirm");
      alert("Something went wrong. Please try again.");
    }
  }

  if (cancelDate) {
    return (
      <div
        style={{
          padding: "14px 20px",
          borderRadius: 12,
          background: "rgba(255,165,0,0.06)",
          border: "1px solid rgba(255,165,0,0.2)",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
          Your membership will end on{" "}
          <strong style={{ color: "#ffa500" }}>{formattedDate}</strong>. You keep full access until then.
        </span>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "rgba(255,68,68,0.06)",
          border: "1px solid rgba(255,68,68,0.2)",
          marginBottom: 24,
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 12px" }}>
          Are you sure? Your access will end at the end of your current billing period.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={confirm}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "#ff4444",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
            }}
          >
            Yes, cancel
          </button>
          <button
            type="button"
            onClick={() => setStep("idle")}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
              fontSize: 13,
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
            }}
          >
            Never mind
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={() => setStep("confirm")}
        disabled={step === "loading"}
        style={{
          padding: "9px 20px",
          borderRadius: 8,
          background: "transparent",
          color: "rgba(255,255,255,0.35)",
          fontWeight: 600,
          fontSize: 13,
          border: "1px solid rgba(255,255,255,0.1)",
          cursor: "pointer",
        }}
      >
        Cancel Membership
      </button>
    </div>
  );
}
