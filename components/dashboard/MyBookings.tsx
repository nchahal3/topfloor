"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Clock, X, AlertTriangle } from "lucide-react";
import type { BookingRow } from "@/lib/supabase";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "rgba(240,192,64,0.12)",  color: "#f0c040",  label: "Pending" },
  confirmed: { bg: "rgba(0,255,136,0.12)",   color: "#00ff88",  label: "Confirmed" },
  completed: { bg: "rgba(192,192,192,0.12)", color: "#c0c0c0",  label: "Completed" },
  cancelled: { bg: "rgba(255,68,68,0.12)",   color: "#ff4444",  label: "Cancelled" },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = () =>
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCancelConfirm = async (id: string) => {
    setCancelling(id);
    setConfirmId(null);
    await fetch(`/api/bookings/${id}`, { method: "PATCH" });
    await load();
    setCancelling(null);
  };

  if (loading || bookings.length === 0) return null;

  const active = bookings.filter((b) => ["pending", "confirmed"].includes(b.status));
  const history = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));

  const renderBooking = (b: BookingRow) => {
    const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
    const canCancel = ["pending", "confirmed"].includes(b.status);
    const isConfirming = confirmId === b.id;

    return (
      <div key={b.id} style={{ borderRadius: 14, background: "#111", border: `1px solid ${isConfirming ? "rgba(255,68,68,0.3)" : "rgba(255,255,255,0.06)"}`, overflow: "hidden", transition: "border-color 0.2s" }}>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: b.call_type === "intro" ? "#00ff88" : "#f0c040", background: b.call_type === "intro" ? "rgba(0,255,136,0.1)" : "rgba(240,192,64,0.1)", padding: "2px 8px", borderRadius: 5 }}>
                  {b.call_type === "intro" ? "Intro Call" : "Trade Review"}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 5 }}>
                  {s.label}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: b.topic ? 6 : 0 }}>
                <Clock size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{b.preferred_time} <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>EST</span></span>
              </div>

              {b.topic && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "4px 0 0", fontStyle: "italic" }}>"{b.topic}"</p>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {b.zoom_link && b.status === "confirmed" && (
                <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  Join Zoom <ExternalLink size={11} />
                </a>
              )}
              {canCancel && !isConfirming && (
                <button
                  type="button"
                  onClick={() => setConfirmId(b.id)}
                  disabled={cancelling === b.id}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff6666", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: cancelling === b.id ? 0.5 : 1 }}
                >
                  <X size={11} /> {cancelling === b.id ? "Cancelling..." : "Cancel"}
                </button>
              )}
            </div>
          </div>

          {b.status === "pending" && !isConfirming && (
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "10px 0 0" }}>
              Coach Floor will confirm within 24 hours — you&apos;ll get an email with your Zoom link.
            </p>
          )}
          {b.status === "confirmed" && !b.zoom_link && !isConfirming && (
            <p style={{ color: "rgba(240,192,64,0.5)", fontSize: 11, margin: "10px 0 0" }}>
              Confirmed — Zoom link coming soon.
            </p>
          )}
        </div>

        {isConfirming && (
          <div style={{ padding: "14px 20px", background: "rgba(255,68,68,0.06)", borderTop: "1px solid rgba(255,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} style={{ color: "#ff6666", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Cancel this booking request?</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Keep It
              </button>
              <button
                type="button"
                onClick={() => handleCancelConfirm(b.id)}
                style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.4)", color: "#ff6666", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 40 }}>
      {active.length > 0 && (
        <>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Your Active Bookings
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {active.map(renderBooking)}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: 0, marginBottom: showHistory ? 12 : 0 }}
          >
            {showHistory ? "▾" : "▸"} Booking History ({history.length})
          </button>
          {showHistory && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {history.map(renderBooking)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
