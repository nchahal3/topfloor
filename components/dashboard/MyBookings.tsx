"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Clock } from "lucide-react";
import type { BookingRow } from "@/lib/supabase";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "rgba(240,192,64,0.12)",  color: "#f0c040",  label: "Pending" },
  confirmed: { bg: "rgba(0,255,136,0.12)",   color: "#00ff88",  label: "Confirmed" },
  completed: { bg: "rgba(192,192,192,0.12)", color: "#c0c0c0",  label: "Completed" },
  cancelled: { bg: "rgba(255,68,68,0.12)",   color: "#ff4444",  label: "Cancelled" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (bookings.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>
        Your Booking Requests
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bookings.map((b) => {
          const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
          return (
            <div
              key={b.id}
              style={{
                padding: "16px 20px", borderRadius: 14,
                background: "#111", border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                      color: b.call_type === "intro" ? "#00ff88" : "#f0c040",
                      background: b.call_type === "intro" ? "rgba(0,255,136,0.1)" : "rgba(240,192,64,0.1)",
                      padding: "2px 8px", borderRadius: 5,
                    }}>
                      {b.call_type === "intro" ? "Intro Call" : "Trade Review"}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 5 }}>
                      {s.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: b.topic ? 6 : 0 }}>
                    <Clock size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{b.preferred_time}</span>
                  </div>

                  {b.topic && (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "4px 0 0", fontStyle: "italic" }}>
                      "{b.topic}"
                    </p>
                  )}
                </div>

                {b.zoom_link && b.status === "confirmed" && (
                  <a
                    href={b.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 8, flexShrink: 0,
                      background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)",
                      color: "#00ff88", fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}
                  >
                    Join Zoom <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {b.status === "pending" && (
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "10px 0 0" }}>
                  Coach Floor will confirm within 24 hours — check your email for the Zoom link.
                </p>
              )}
              {b.status === "confirmed" && !b.zoom_link && (
                <p style={{ color: "rgba(240,192,64,0.5)", fontSize: 11, margin: "10px 0 0" }}>
                  Confirmed — Zoom link coming soon.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
