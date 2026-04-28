"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BookingRow } from "@/lib/supabase";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(240,192,64,0.15)",  color: "#f0c040" },
  confirmed: { bg: "rgba(0,255,136,0.15)",   color: "#00ff88" },
  completed: { bg: "rgba(192,192,192,0.15)", color: "#c0c0c0" },
  cancelled: { bg: "rgba(255,68,68,0.15)",   color: "#ff4444" },
};

const FILTER_TABS = ["all", ...STATUS_OPTIONS];

export default function BookingsTab({ filterEmail }: { filterEmail?: string }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, { status: string; admin_notes: string; scheduled_at: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const url = filterEmail ? `/api/admin/bookings?email=${encodeURIComponent(filterEmail)}` : "/api/admin/bookings";
    const res = await fetch(url);
    const data = await res.json();
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filterEmail]);

  const initEdit = (b: BookingRow) => {
    if (!editState[b.id]) {
      setEditState((prev) => ({
        ...prev,
        [b.id]: { status: b.status, admin_notes: b.admin_notes ?? "", scheduled_at: b.scheduled_at ?? "" },
      }));
    }
    setExpandedId((prev) => (prev === b.id ? null : b.id));
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const e = editState[id];
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.status, admin_notes: e.admin_notes || null, scheduled_at: e.scheduled_at || null }),
    });
    await fetchBookings();
    setExpandedId(null);
    setSaving(null);
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      {!filterEmail && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: 0 }}>1-on-1 Bookings</h2>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{bookings.length} total</span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTER_TABS.map((tab) => {
          const count = tab === "all" ? bookings.length : bookings.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${filter === tab ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: filter === tab ? "rgba(0,255,136,0.08)" : "transparent",
                color: filter === tab ? "#00ff88" : "rgba(255,255,255,0.4)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tab} {count > 0 && <span style={{ opacity: 0.6 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Loading bookings...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No bookings {filter !== "all" ? `with status "${filter}"` : "yet"}.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((b) => {
            const s = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
            const isExpanded = expandedId === b.id;
            const e = editState[b.id] ?? { status: b.status, admin_notes: b.admin_notes ?? "", scheduled_at: b.scheduled_at ?? "" };
            return (
              <div key={b.id} style={{ borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                {/* Row */}
                <button
                  type="button"
                  onClick={() => initEdit(b)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 14 }}>{b.member_name ?? b.member_email}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: b.call_type === "intro" ? "#00ff88" : "#f0c040", background: b.call_type === "intro" ? "rgba(0,255,136,0.1)" : "rgba(240,192,64,0.1)", padding: "2px 7px", borderRadius: 4, textTransform: "uppercase" }}>
                        {b.call_type === "intro" ? "Intro" : "Trade Review"}
                      </span>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, textTransform: "uppercase" }}>{b.status}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>
                      {b.member_email} · {b.preferred_time}
                    </p>
                    {b.topic && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "3px 0 0", fontStyle: "italic" }}>"{b.topic}"</p>}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded edit panel */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                      <div>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Status</label>
                        <select
                          style={inputStyle}
                          value={e.status}
                          onChange={(ev) => setEditState((prev) => ({ ...prev, [b.id]: { ...e, status: ev.target.value } }))}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Scheduled For</label>
                        <input
                          type="datetime-local"
                          style={inputStyle}
                          value={e.scheduled_at}
                          onChange={(ev) => setEditState((prev) => ({ ...prev, [b.id]: { ...e, scheduled_at: ev.target.value } }))}
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Admin Notes</label>
                        <textarea
                          style={{ ...inputStyle, resize: "vertical" }}
                          rows={2}
                          value={e.admin_notes}
                          placeholder="Internal notes about this booking..."
                          onChange={(ev) => setEditState((prev) => ({ ...prev, [b.id]: { ...e, admin_notes: ev.target.value } }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button type="button" onClick={() => handleSave(b.id)} disabled={saving === b.id} style={{ padding: "8px 18px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", opacity: saving === b.id ? 0.6 : 1 }}>
                        {saving === b.id ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setExpandedId(null)} style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
