"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, CalendarPlus, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { BookingRow, AvailabilitySlot } from "@/lib/supabase";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarPicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const select = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today) return;
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Pick a date";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", padding: "7px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
          background: "#1a1a1a", border: `1px solid ${open ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)"}`,
          color: value ? "#f5f5f5" : "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", textAlign: "left", boxSizing: "border-box",
        }}
      >
        <Calendar size={13} style={{ color: value ? "#00ff88" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        {displayValue}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
          padding: 14, width: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" title="Previous month" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, display: "flex" }}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 700 }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" title="Next month" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, display: "flex" }}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", padding: "2px 0" }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isPast = cellDate < today;
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = iso === value;
              const isToday = cellDate.getTime() === today.getTime();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  disabled={isPast}
                  style={{
                    padding: "5px 0", borderRadius: 6, fontSize: 12, fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? "#00ff88" : isToday ? "rgba(0,255,136,0.1)" : "transparent",
                    color: isSelected ? "#000" : isPast ? "rgba(255,255,255,0.15)" : "#f5f5f5",
                    border: isToday && !isSelected ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent",
                    cursor: isPast ? "not-allowed" : "pointer",
                    textAlign: "center",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const MONTH_MAP: Record<string, number> = {
  January:0,February:1,March:2,April:3,May:4,June:5,
  July:6,August:7,September:8,October:9,November:10,December:11,
};

function preferredTimeToDatetimeLocal(preferred: string): string {
  // "Sunday, May 10, 2026 at 11:00 AM"
  const parts = preferred.split(" at ");
  if (parts.length !== 2) return "";
  const dateMatch = parts[0].match(/([A-Za-z]+)\s+(\d+),\s+(\d{4})$/);
  const timeMatch = parts[1].trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!dateMatch || !timeMatch) return "";
  const month = MONTH_MAP[dateMatch[1]];
  const day = parseInt(dateMatch[2]);
  const year = parseInt(dateMatch[3]);
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const period = timeMatch[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  if (month === undefined || isNaN(day) || isNaN(year)) return "";
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(240,192,64,0.15)",  color: "#f0c040" },
  confirmed: { bg: "rgba(0,255,136,0.15)",   color: "#00ff88" },
  completed: { bg: "rgba(192,192,192,0.15)", color: "#c0c0c0" },
  cancelled: { bg: "rgba(255,68,68,0.15)",   color: "#ff4444" },
};
const FILTER_TABS = ["all", ...STATUS_OPTIONS];
const TIMES = [
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM",
  "2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM",
  "5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM",
];

function formatSlotDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// ─── Availability Panel ───────────────────────────────────────────────────────
function AvailabilityPanel() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("9:00 AM");
  const [newEndTime, setNewEndTime] = useState("1:00 PM");
  const [newDuration, setNewDuration] = useState(30);
  const [newCallType, setNewCallType] = useState("any");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<{ created: number; skipped: number } | null>(null);

  const fetch$ = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/availability");
    const data = await res.json();
    setSlots(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetch$(); }, []);

  const handleAdd = async () => {
    if (!newDate || !newStartTime || !newEndTime) return;
    setAdding(true);
    setAddResult(null);
    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, start_time: newStartTime, end_time: newEndTime, duration_minutes: newDuration, call_type: newCallType }),
    });
    const data = await res.json();
    await fetch$();
    setAddResult({ created: data.created?.length ?? 0, skipped: data.skipped?.length ?? 0 });
    setNewDate("");
    setShowForm(false);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/admin/availability/${id}`, { method: "DELETE" });
    await fetch$();
    setDeletingId(null);
  };

  const inputStyle: React.CSSProperties = {
    padding: "7px 10px", borderRadius: 8, background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5",
    fontSize: 13, outline: "none",
  };

  const today = new Date().toISOString().split("T")[0];
  const upcomingSlots = slots.filter((s) => s.date >= today);
  const pastSlots = slots.filter((s) => s.date < today);

  const slotsByDate: Record<string, AvailabilitySlot[]> = upcomingSlots.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ color: "#f5f5f5", fontSize: 15, fontWeight: 700, margin: 0 }}>Available Time Slots</h3>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "3px 0 0" }}>
            Set your availability window — slots are auto-generated and session conflicts are skipped
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setAddResult(null); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          <CalendarPlus size={14} /> Add Availability
        </button>
      </div>

      {addResult && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: addResult.created > 0 ? "rgba(0,255,136,0.07)" : "rgba(255,68,68,0.07)", border: `1px solid ${addResult.created > 0 ? "rgba(0,255,136,0.2)" : "rgba(255,68,68,0.2)"}` }}>
          <p style={{ margin: 0, fontSize: 13, color: addResult.created > 0 ? "#00ff88" : "#ff6666" }}>
            {addResult.created > 0 ? `✓ ${addResult.created} slot${addResult.created !== 1 ? "s" : ""} added` : "No slots added"}
            {addResult.skipped > 0 && <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>· {addResult.skipped} skipped (session conflict)</span>}
          </p>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: 16, padding: "16px", borderRadius: 12, background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 12px" }}>New Availability Block</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
              <CalendarPicker value={newDate} onChange={setNewDate} />
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>From (EST)</label>
              <select value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>To (EST)</label>
              <select value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Slot Length</label>
              <select value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Call Type</label>
              <select value={newCallType} onChange={(e) => setNewCallType(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                <option value="any">Any</option>
                <option value="intro">Intro Only</option>
                <option value="trade_review">Trade Review Only</option>
              </select>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "10px 0 0" }}>
            Slots are generated every {newDuration} min between {newStartTime} – {newEndTime}. Times that overlap with scheduled sessions are automatically skipped.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !newDate}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: adding || !newDate ? "not-allowed" : "pointer", opacity: adding || !newDate ? 0.5 : 1 }}
            >
              <Plus size={13} /> {adding ? "Generating..." : "Generate Slots"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 13, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "20px 0" }}>Loading slots...</p>
      ) : upcomingSlots.length === 0 ? (
        <div style={{ padding: "28px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, margin: 0 }}>No upcoming slots. Add some above.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dateSlots]) => (
            <div key={date} style={{ borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 700 }}>{formatSlotDate(date)}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 8 }}>{dateSlots.length} slot{dateSlots.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 14px" }}>
                {dateSlots.map((slot) => (
                  <div key={slot.id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", borderRadius: 8,
                    background: slot.is_booked ? "rgba(255,68,68,0.07)" : "rgba(0,255,136,0.07)",
                    border: `1px solid ${slot.is_booked ? "rgba(255,68,68,0.2)" : "rgba(0,255,136,0.2)"}`,
                  }}>
                    <span style={{ color: slot.is_booked ? "#ff6666" : "#00ff88", fontSize: 13, fontWeight: 600 }}>{slot.time_est}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{slot.duration_minutes}m</span>
                    {slot.call_type !== "any" && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>
                        {slot.call_type === "intro" ? "Intro" : "Review"}
                      </span>
                    )}
                    {slot.is_booked && (
                      <span style={{ fontSize: 10, color: "#ff6666", fontWeight: 700 }}>BOOKED</span>
                    )}
                    {!slot.is_booked && (
                      <button
                        type="button"
                        onClick={() => handleDelete(slot.id)}
                        disabled={deletingId === slot.id}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: deletingId === slot.id ? 0.4 : 0.5 }}
                      >
                        <Trash2 size={12} style={{ color: "#ff4444" }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pastSlots.length > 0 && (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 12, textAlign: "right" }}>
          {pastSlots.length} past slot{pastSlots.length !== 1 ? "s" : ""} hidden
        </p>
      )}
    </div>
  );
}

// ─── Main BookingsTab ──────────────────────────────────────────────────────────
export default function BookingsTab({ filterEmail }: { filterEmail?: string }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, { status: string; admin_notes: string; scheduled_at: string; zoom_link: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"bookings" | "availability">("bookings");

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
      const scheduledAt = b.scheduled_at ?? preferredTimeToDatetimeLocal(b.preferred_time ?? "");
      setEditState((prev) => ({
        ...prev,
        [b.id]: {
          status: b.status,
          admin_notes: b.admin_notes ?? "",
          scheduled_at: scheduledAt,
          zoom_link: b.zoom_link ?? "",
        },
      }));
    }
    setExpandedId((prev) => (prev === b.id ? null : b.id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking permanently?")) return;
    setDeleting(id);
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    await fetchBookings();
    setDeleting(null);
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const e = editState[id];
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: e.status,
        admin_notes: e.admin_notes || null,
        scheduled_at: e.scheduled_at || null,
        zoom_link: e.zoom_link || null,
      }),
    });
    await fetchBookings();
    setExpandedId(null);
    setSaving(null);
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      {!filterEmail && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: 0 }}>1-on-1 Bookings</h2>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{bookings.length} total</span>
        </div>
      )}

      {/* Section tabs */}
      {!filterEmail && (
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
          {(["bookings", "availability"] as const).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSection(sec)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: activeSection === sec ? "#1a1a1a" : "transparent",
                border: activeSection === sec ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
                color: activeSection === sec ? "#f5f5f5" : "rgba(255,255,255,0.35)",
                cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {sec === "bookings" ? `Requests (${bookings.length})` : "Manage Slots"}
            </button>
          ))}
        </div>
      )}

      {activeSection === "availability" && !filterEmail ? (
        <AvailabilityPanel />
      ) : (
        <>
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
                    padding: "5px 12px", borderRadius: 999,
                    border: `1px solid ${filter === tab ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background: filter === tab ? "rgba(0,255,136,0.08)" : "transparent",
                    color: filter === tab ? "#00ff88" : "rgba(255,255,255,0.4)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
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
                const e = editState[b.id] ?? { status: b.status, admin_notes: b.admin_notes ?? "", scheduled_at: b.scheduled_at ?? "", zoom_link: b.zoom_link ?? "" };
                return (
                  <div key={b.id} style={{ borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => initEdit(b)}
                        style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0 }}
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
                      {["cancelled", "completed"].includes(b.status) && (
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(b.id); }}
                          disabled={deleting === b.id}
                          style={{ flexShrink: 0, padding: "6px 12px", marginRight: 12, borderRadius: 6, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff6666", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: deleting === b.id ? 0.5 : 1 }}
                        >
                          {deleting === b.id ? "..." : "Delete"}
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ marginTop: 12, marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Requested Time: </span>
                          <span style={{ color: "#f0c040", fontSize: 12, fontWeight: 600 }}>{b.preferred_time}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
                            <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Meeting Link</label>
                            <input
                              type="url"
                              style={inputStyle}
                              value={e.zoom_link}
                              placeholder="https://zoom.us/j/... or discord.gg/..."
                              onChange={(ev) => setEditState((prev) => ({ ...prev, [b.id]: { ...e, zoom_link: ev.target.value } }))}
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
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => handleSave(b.id)} disabled={saving === b.id} style={{ padding: "8px 18px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", opacity: saving === b.id ? 0.6 : 1 }}>
                              {saving === b.id ? "Saving..." : "Save Changes"}
                            </button>
                            <button type="button" onClick={() => setExpandedId(null)} style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>Cancel</button>
                          </div>
                          {["cancelled", "completed"].includes(b.status) && (
                            <button type="button" onClick={() => handleDelete(b.id)} disabled={deleting === b.id} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff6666", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: deleting === b.id ? 0.5 : 1 }}>
                              {deleting === b.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
