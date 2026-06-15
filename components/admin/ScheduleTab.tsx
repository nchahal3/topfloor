"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check } from "lucide-react";
import type { SessionRow } from "@/lib/supabase";
import { datetimeLocalToTimeEst } from "@/lib/time";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ORDER: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
const TYPES = ["Live", "Live Trading", "Coaching", "Planning", "Workshop"];
const TIERS = [
  { value: "", label: "Free — All Members" },
  { value: "bronze", label: "Bronze+" },
  { value: "silver", label: "Silver+" },
  { value: "gold", label: "Gold+" },
];
const TYPE_COLORS: Record<string, string> = {
  Live: "#00ff88", "Live Trading": "#f0c040", Coaching: "#c0c0c0", Planning: "#cd7f32", Workshop: "#a78bfa",
};

const BLANK_FORM = {
  day: "Monday", time_est: "", title: "", description: "", type: "Live",
  requires_tier: "", is_active: true, is_recurring: true, scheduled_for: "",
  discord_link: "https://discord.gg/TVxNWph5BQ", duration_minutes: 60,
};

export default function ScheduleTab() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sessions");
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const openAdd = () => { setForm({ ...BLANK_FORM }); setEditId(null); setShowForm(true); };
  const openEdit = (s: SessionRow) => {
    setForm({
      day: s.day, time_est: s.time_est, title: s.title,
      description: s.description ?? "", type: s.type,
      requires_tier: s.requires_tier ?? "", is_active: s.is_active,
      is_recurring: s.is_recurring, scheduled_for: s.scheduled_for ?? "",
      discord_link: s.discord_link, duration_minutes: s.duration_minutes ?? 60,
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      day_order: form.is_recurring ? (DAY_ORDER[form.day] ?? 0) : 99,
      requires_tier: form.requires_tier || null,
      scheduled_for: form.scheduled_for || null,
      duration_minutes: form.duration_minutes || 60,
    };
    const url = editId ? `/api/admin/sessions/${editId}` : "/api/admin/sessions";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await fetchSessions();
    setShowForm(false);
    setSaving(false);
  };

  const handleToggle = async (s: SessionRow) => {
    await fetch(`/api/admin/sessions/${s.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((x) => x.id !== id));
    setDeleteId(null);
  };

  const inp = (field: string, value: string | boolean, type = "text") => (
    type === "checkbox"
      ? setForm((f) => ({ ...f, [field]: value as boolean }))
      : setForm((f) => ({ ...f, [field]: value as string }))
  );

  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: 0 }}>Session Schedule</h2>
        <button type="button" onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Add Session
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ background: "#111", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ color: "#00ff88", fontWeight: 700, fontSize: 14, margin: 0 }}>{editId ? "Edit Session" : "New Session"}</p>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={form.title} onChange={(e) => inp("title", e.target.value)} placeholder="Session title" />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={(e) => inp("type", e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Recurring</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ v: true, l: "Weekly" }, { v: false, l: "One-time" }].map(({ v, l }) => (
                  <button key={l} type="button" onClick={() => inp("is_recurring", v)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${form.is_recurring === v ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`, background: form.is_recurring === v ? "rgba(0,255,136,0.06)" : "transparent", color: form.is_recurring === v ? "#00ff88" : "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            </div>
            {form.is_recurring ? (
              <div>
                <label style={labelStyle}>Day</label>
                <select style={inputStyle} value={form.day} onChange={(e) => inp("day", e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Date (auto-fills time below)</label>
                <input
                  style={inputStyle}
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(e) => {
                    inp("scheduled_for", e.target.value);
                    const derived = datetimeLocalToTimeEst(e.target.value);
                    if (derived) inp("time_est", derived);
                  }}
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Time EST</label>
              <input style={inputStyle} value={form.time_est} onChange={(e) => inp("time_est", e.target.value)} placeholder="9:00 AM" />
            </div>
            <div>
              <label style={labelStyle}>Duration (minutes)</label>
              <input
                style={inputStyle}
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Required Tier</label>
              <select style={inputStyle} value={form.requires_tier} onChange={(e) => inp("requires_tier", e.target.value)}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={form.description} onChange={(e) => inp("description", e.target.value)} placeholder="Short description..." />
            </div>
            <div>
              <label style={labelStyle}>Discord Link</label>
              <input style={inputStyle} value={form.discord_link} onChange={(e) => inp("discord_link", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={handleSave} disabled={saving || !form.title || !form.time_est} style={{ padding: "9px 20px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : <><Check size={13} style={{ display: "inline", marginRight: 4 }} />Save</>}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Loading sessions...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((s) => {
            const typeColor = TYPE_COLORS[s.type] ?? "#00ff88";
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.05)", opacity: s.is_active ? 1 : 0.45 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 14 }}>{s.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: typeColor, background: `${typeColor}18`, padding: "2px 7px", borderRadius: 4 }}>{s.type.toUpperCase()}</span>
                    {s.requires_tier && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 4 }}>{s.requires_tier}+</span>}
                    {!s.is_active && <span style={{ fontSize: 10, color: "#ff4444", background: "rgba(255,68,68,0.1)", padding: "2px 7px", borderRadius: 4 }}>INACTIVE</span>}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>
                    {s.is_recurring ? `${s.day} · ` : "One-time · "}{s.time_est}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => handleToggle(s)} title={s.is_active ? "Deactivate" : "Activate"} style={{ background: "none", border: "none", cursor: "pointer", color: s.is_active ? "#00ff88" : "rgba(255,255,255,0.25)", padding: 4 }}>
                    {s.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button type="button" onClick={() => openEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}><Pencil size={14} /></button>
                  {deleteId === s.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => handleDelete(s.id)} style={{ background: "#ff4444", border: "none", cursor: "pointer", color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Delete</button>
                      <button type="button" onClick={() => setDeleteId(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "3px 8px", borderRadius: 6, fontSize: 11 }}>Cancel</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setDeleteId(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,68,68,0.5)", padding: 4 }}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No sessions yet. Add one above.</p>}
        </div>
      )}
    </div>
  );
}
