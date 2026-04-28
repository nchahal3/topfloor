"use client";

import { useState } from "react";
import { CheckCircle, Calendar } from "lucide-react";

export default function BookingForm() {
  const [callType, setCallType] = useState("intro");
  const [preferredTime, setPreferredTime] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_type: callType, preferred_time: preferredTime, topic }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: "48px 32px",
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))",
          border: "1px solid rgba(0,255,136,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={24} style={{ color: "#00ff88" }} />
        </div>
        <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>Request Submitted!</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Coach Floor will confirm your call within 24 hours. Check your email for a confirmation.
        </p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setPreferredTime(""); setTopic(""); }}
          style={{ marginTop: 20, background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", padding: "8px 20px", borderRadius: 999, fontSize: 13, cursor: "pointer" }}
        >
          Book Another
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 8,
  };

  return (
    <div style={{ padding: "28px", borderRadius: 20, background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={16} style={{ color: "#00ff88" }} />
        </div>
        <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: 0 }}>Request a Call</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Call type */}
        <div>
          <label style={labelStyle}>Call Type</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: "intro", label: "Intro Call", desc: "15 min — free for all members" },
              { value: "trade_review", label: "Trade Review", desc: "30 min — for subscribers" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCallType(opt.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${callType === opt.value ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
                  background: callType === opt.value ? "rgba(0,255,136,0.06)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <p style={{ color: callType === opt.value ? "#00ff88" : "#f5f5f5", fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{opt.label}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred time */}
        <div>
          <label style={labelStyle}>Preferred Time</label>
          <input
            type="text"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            placeholder="e.g. Weekday mornings, Thursdays after 2pm EST"
            required
            style={inputStyle}
          />
        </div>

        {/* Topic */}
        <div>
          <label style={labelStyle}>What do you want to discuss?</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. My last 5 trades keep stopping out, want to review my entry timing..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {error && (
          <p style={{ color: "#ff4444", fontSize: 13, margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !preferredTime}
          style={{
            padding: "13px",
            borderRadius: 999,
            background: "#00ff88",
            color: "#000",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: loading || !preferredTime ? "not-allowed" : "pointer",
            opacity: loading || !preferredTime ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "Submitting..." : "Request Call →"}
        </button>
      </form>
    </div>
  );
}
