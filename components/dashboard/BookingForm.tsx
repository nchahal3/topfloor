"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilitySlot } from "@/lib/supabase";

type ActiveBooking = { id: string; status: string; preferred_time: string; call_type: string };

type SlotsByDate = Record<string, AvailabilitySlot[]>;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function BookingForm() {
  const [callType, setCallType] = useState("intro");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [dateOffset, setDateOffset] = useState(0);

  const fetchAvailability = () => {
    setSlotsLoading(true);
    return fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => {
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setActiveBooking(data.activeBooking ?? null);
        setSlotsLoading(false);
      })
      .catch(() => setSlotsLoading(false));
  };

  useEffect(() => { fetchAvailability(); }, []);

  const slotsByDate: SlotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as SlotsByDate);

  const availableDates = Object.keys(slotsByDate).sort();
  const visibleDates = availableDates.slice(dateOffset, dateOffset + 5);
  const slotsForDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];
  const filteredSlots = slotsForDate.filter((s) => s.call_type === "any" || s.call_type === callType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_type: callType,
          preferred_time: `${formatDateLong(selectedSlot.date)} at ${selectedSlot.time_est}`,
          topic,
          slot_id: selectedSlot.id,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong.");
        if (res.status === 409) {
          setSelectedSlot(null);
          setSelectedDate(null);
          await fetchAvailability();
        }
        return;
      }
      setSubmitted(true);
      // Notify MyBookings to refresh
      window.dispatchEvent(new CustomEvent("topfloor:booking-created"));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (activeBooking) {
    const STATUS_COLOR: Record<string, string> = { pending: "#f0c040", confirmed: "#00ff88" };
    const color = STATUS_COLOR[activeBooking.status] ?? "#f0c040";
    return (
      <div style={{ padding: "28px", borderRadius: 20, background: "#111", border: `1px solid ${color}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Clock size={18} style={{ color }} />
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: 0 }}>You Have an Active Booking</p>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: `${color}0d`, border: `1px solid ${color}25`, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color, background: `${color}18`, padding: "2px 8px", borderRadius: 5 }}>
              {activeBooking.status}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase" as const }}>
              {activeBooking.call_type === "intro" ? "Intro Call" : "Trade Review"}
            </span>
          </div>
          <p style={{ color: "#f5f5f5", fontSize: 14, margin: 0 }}>{activeBooking.preferred_time}</p>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          {activeBooking.status === "pending"
            ? "Your request is pending — Coach Floor will confirm within 24 hours. You can book a new slot once this is completed or cancelled."
            : "You have a confirmed call coming up. Once it's completed you'll be able to book again."}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: "48px 32px", borderRadius: 20, background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))", border: "1px solid rgba(0,255,136,0.2)", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={24} style={{ color: "#00ff88" }} />
        </div>
        <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>Request Submitted!</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Coach Floor will confirm your call within 24 hours. Check your email for a Zoom link.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setSelectedSlot(null);
            setSelectedDate(null);
            setTopic("");
            fetchAvailability();
          }}
          style={{ marginTop: 20, background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", padding: "8px 20px", borderRadius: 999, fontSize: 13, cursor: "pointer" }}
        >
          Book Another
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", color: "rgba(255,255,255,0.5)", fontSize: 12,
    fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8,
  };

  return (
    <div style={{ padding: "28px", borderRadius: 20, background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={16} style={{ color: "#00ff88" }} />
        </div>
        <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: 0 }}>Request a Call</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
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
                onClick={() => { setCallType(opt.value); setSelectedSlot(null); }}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${callType === opt.value ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
                  background: callType === opt.value ? "rgba(0,255,136,0.06)" : "transparent",
                }}
              >
                <p style={{ color: callType === opt.value ? "#00ff88" : "#f5f5f5", fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{opt.label}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Date picker */}
        <div>
          <label style={labelStyle}>Pick a Date <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— all times EST</span></label>
          {slotsLoading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Loading available dates...
            </div>
          ) : availableDates.length === 0 ? (
            <div style={{ padding: "20px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <Clock size={18} style={{ color: "rgba(255,255,255,0.2)", marginBottom: 8 }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: 0 }}>No available slots right now.</p>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: "4px 0 0" }}>Check back soon — Coach Floor adds new slots regularly.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDateOffset((o) => Math.max(0, o - 5))}
                  disabled={dateOffset === 0}
                  style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: dateOffset === 0 ? "not-allowed" : "pointer", opacity: dateOffset === 0 ? 0.3 : 1, flexShrink: 0 }}
                >
                  <ChevronLeft size={14} style={{ color: "#f5f5f5" }} />
                </button>

                <div style={{ display: "flex", gap: 8, flex: 1, overflowX: "auto" }}>
                  {visibleDates.map((d) => {
                    const isSelected = d === selectedDate;
                    const hasSlotsForType = (slotsByDate[d] ?? []).some((s) => s.call_type === "any" || s.call_type === callType);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                        disabled={!hasSlotsForType}
                        style={{
                          minWidth: 72, padding: "10px 6px", borderRadius: 12, textAlign: "center",
                          border: `1px solid ${isSelected ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.08)"}`,
                          background: isSelected ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.02)",
                          cursor: hasSlotsForType ? "pointer" : "not-allowed",
                          opacity: hasSlotsForType ? 1 : 0.35,
                          flexShrink: 0,
                        }}
                      >
                        <p style={{ color: isSelected ? "#00ff88" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                          {new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p style={{ color: isSelected ? "#00ff88" : "#f5f5f5", fontSize: 18, fontWeight: 700, margin: "0 0 2px", lineHeight: 1 }}>
                          {new Date(d + "T12:00:00").getDate()}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0 }}>
                          {new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setDateOffset((o) => o + 5)}
                  disabled={dateOffset + 5 >= availableDates.length}
                  style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: dateOffset + 5 >= availableDates.length ? "not-allowed" : "pointer", opacity: dateOffset + 5 >= availableDates.length ? 0.3 : 1, flexShrink: 0 }}
                >
                  <ChevronRight size={14} style={{ color: "#f5f5f5" }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <label style={labelStyle}>Pick a Time — {formatDate(selectedDate)}</label>
            {filteredSlots.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "12px 0" }}>
                No slots available for {callType === "intro" ? "Intro Calls" : "Trade Reviews"} on this date.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {filteredSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                        border: `1px solid ${isSelected ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.1)"}`,
                        background: isSelected ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.03)",
                        color: isSelected ? "#00ff88" : "#f5f5f5",
                        fontSize: 14, fontWeight: isSelected ? 700 : 500,
                        transition: "all 0.15s",
                      }}
                    >
                      {slot.time_est}
                      <span style={{ fontSize: 11, color: isSelected ? "rgba(0,255,136,0.6)" : "rgba(255,255,255,0.25)", marginLeft: 6 }}>
                        {slot.duration_minutes}m
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected summary */}
        {selectedSlot && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={16} style={{ color: "#00ff88", flexShrink: 0 }} />
            <p style={{ color: "#f5f5f5", fontSize: 13, margin: 0 }}>
              <span style={{ fontWeight: 700, color: "#00ff88" }}>{selectedSlot.time_est}</span>
              {" · "}{formatDateLong(selectedSlot.date)}
              {" · "}{selectedSlot.duration_minutes} min
            </p>
          </div>
        )}

        {/* Topic */}
        <div>
          <label style={labelStyle}>What do you want to discuss? <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. My last 5 trades keep stopping out, want to review my entry timing..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.3)", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ color: "#ff6666", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>⚠</span>
            <p style={{ color: "#ff6666", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedSlot}
          style={{
            padding: "13px", borderRadius: 999, background: "#00ff88",
            color: "#000", fontWeight: 700, fontSize: 14, border: "none",
            cursor: loading || !selectedSlot ? "not-allowed" : "pointer",
            opacity: loading || !selectedSlot ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "Submitting..." : selectedSlot ? `Book ${selectedSlot.time_est} →` : "Select a Time Slot"}
        </button>
      </form>
    </div>
  );
}
