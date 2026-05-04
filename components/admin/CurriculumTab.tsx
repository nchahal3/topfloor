"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check,
  ChevronRight, ChevronDown as ChevronDownIcon, FileText, Play,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tier = "bronze" | "silver" | "gold" | "lifetime";

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  notes: string | null;
  video_id: string | null;
  pdf_path: string | null;
  order_index: number;
  created_at: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  tier: Tier | null;
  order_index: number;
  created_at: string;
  lessons: Lesson[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#f0c040",
  lifetime: "#00ff88",
};

const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "lifetime", label: "Lifetime" },
];

const BLANK_MODULE = { title: "", description: "", tier: "bronze" as Tier };
const BLANK_LESSON = { title: "", notes: "", video_id: "", module_id: "" };

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#f5f5f5",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.4)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 5,
};

// ─── TierBadge ────────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const color = TIER_COLORS[tier] ?? "#f5f5f5";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        padding: "2px 8px",
        borderRadius: 4,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        flexShrink: 0,
      }}
    >
      {tier}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CurriculumTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Panel state: "addModule" | "editModule" | "addLesson" | "editLesson" | null
  const [panel, setPanel] = useState<
    | { type: "addModule" }
    | { type: "editModule"; module: Module }
    | { type: "addLesson"; moduleId: string }
    | { type: "editLesson"; lesson: Lesson }
    | null
  >(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "module"; id: string }
    | { kind: "lesson"; id: string }
    | null
  >(null);

  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/curriculum/modules");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  // ── Toggle module expand ───────────────────────────────────────────────────

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Reorder ────────────────────────────────────────────────────────────────

  const reorder = async (type: "module" | "lesson", id: string, direction: "up" | "down") => {
    await fetch("/api/admin/curriculum/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, direction }),
    });
    await fetchModules();
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const url =
      deleteTarget.kind === "module"
        ? `/api/admin/curriculum/modules/${deleteTarget.id}`
        : `/api/admin/curriculum/lessons/${deleteTarget.id}`;
    await fetch(url, { method: "DELETE" });
    setDeleteTarget(null);
    setDeleting(false);
    await fetchModules();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: 0 }}>Curriculum</h2>
        <button
          type="button"
          onClick={() => setPanel({ type: "addModule" })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
        >
          <Plus size={14} /> Add Module
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff4444", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Loading curriculum...</p>
      ) : modules.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No modules yet. Add one above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {modules.map((mod, modIdx) => {
            const expanded = expandedModules.has(mod.id);
            return (
              <div
                key={mod.id}
                style={{ borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}
              >
                {/* Module row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}
                  >
                    {expanded ? <ChevronDownIcon size={15} /> : <ChevronRight size={15} />}
                  </button>

                  {/* Title + badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 14 }}>{mod.title}</span>
                      <TierBadge tier={mod.tier} />
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                        {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {mod.description && (
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0", lineHeight: 1.4 }}>
                        {mod.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                    <button type="button" onClick={() => reorder("module", mod.id, "up")} disabled={modIdx === 0} style={{ background: "none", border: "none", cursor: modIdx === 0 ? "default" : "pointer", color: modIdx === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.4)", padding: 4 }}><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => reorder("module", mod.id, "down")} disabled={modIdx === modules.length - 1} style={{ background: "none", border: "none", cursor: modIdx === modules.length - 1 ? "default" : "pointer", color: modIdx === modules.length - 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.4)", padding: 4 }}><ChevronDown size={14} /></button>
                    <button type="button" onClick={() => setPanel({ type: "addLesson", moduleId: mod.id })} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.06)", color: "#00ff88", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      <Plus size={11} /> Lesson
                    </button>
                    <button type="button" onClick={() => setPanel({ type: "editModule", module: mod })} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}><Pencil size={13} /></button>
                    {deleteTarget?.kind === "module" && deleteTarget.id === mod.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: "4px 10px", borderRadius: 6, background: "#ff4444", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                          {deleting ? "..." : "Delete"}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>No</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setDeleteTarget({ kind: "module", id: mod.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,68,68,0.5)", padding: 4 }}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "#0d0d0d" }}>
                    {mod.lessons.length === 0 ? (
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, padding: "14px 20px", margin: 0 }}>No lessons yet.</p>
                    ) : (
                      mod.lessons.map((lesson, lesIdx) => (
                        <div
                          key={lesson.id}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 32px", borderBottom: lesIdx < mod.lessons.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ color: "#e0e0e0", fontSize: 13, fontWeight: 500 }}>{lesson.title}</span>
                              {lesson.pdf_path && (
                                <span title="Has PDF" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#f0c040", background: "rgba(240,192,64,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                                  <FileText size={10} /> PDF
                                </span>
                              )}
                              {lesson.video_id && (
                                <span title="Has video" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#00ff88", background: "rgba(0,255,136,0.08)", padding: "2px 6px", borderRadius: 4 }}>
                                  <Play size={10} /> Video
                                </span>
                              )}
                            </div>
                            {lesson.notes && (
                              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
                                {lesson.notes}
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                            <button type="button" onClick={() => reorder("lesson", lesson.id, "up")} disabled={lesIdx === 0} style={{ background: "none", border: "none", cursor: lesIdx === 0 ? "default" : "pointer", color: lesIdx === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.35)", padding: 3 }}><ChevronUp size={13} /></button>
                            <button type="button" onClick={() => reorder("lesson", lesson.id, "down")} disabled={lesIdx === mod.lessons.length - 1} style={{ background: "none", border: "none", cursor: lesIdx === mod.lessons.length - 1 ? "default" : "pointer", color: lesIdx === mod.lessons.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.35)", padding: 3 }}><ChevronDown size={13} /></button>
                            <button type="button" onClick={() => setPanel({ type: "editLesson", lesson })} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 3 }}><Pencil size={12} /></button>
                            {deleteTarget?.kind === "lesson" && deleteTarget.id === lesson.id ? (
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: "3px 8px", borderRadius: 5, background: "#ff4444", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                                  {deleting ? "..." : "Del"}
                                </button>
                                <button type="button" onClick={() => setDeleteTarget(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: "3px 6px", borderRadius: 5, fontSize: 11 }}>No</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setDeleteTarget({ kind: "lesson", id: lesson.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,68,68,0.4)", padding: 3 }}><Trash2 size={12} /></button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out panel */}
      {panel && (
        <SidePanel
          panel={panel}
          modules={modules}
          onClose={() => setPanel(null)}
          onSaved={async () => { setPanel(null); await fetchModules(); }}
        />
      )}
    </div>
  );
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

type PanelType =
  | { type: "addModule" }
  | { type: "editModule"; module: Module }
  | { type: "addLesson"; moduleId: string }
  | { type: "editLesson"; lesson: Lesson };

function SidePanel({
  panel,
  modules,
  onClose,
  onSaved,
}: {
  panel: PanelType;
  modules: Module[];
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(480px, 95vw)", height: "100vh", background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", padding: 24 }}
      >
        {(panel.type === "addModule" || panel.type === "editModule") && (
          <ModuleForm
            existing={panel.type === "editModule" ? panel.module : undefined}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
        {(panel.type === "addLesson" || panel.type === "editLesson") && (
          <LessonForm
            moduleId={panel.type === "addLesson" ? panel.moduleId : panel.lesson.module_id}
            existing={panel.type === "editLesson" ? panel.lesson : undefined}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </div>
    </div>
  );
}

// ─── Module Form ──────────────────────────────────────────────────────────────

function ModuleForm({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Module;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    existing
      ? { title: existing.title, description: existing.description ?? "", tier: existing.tier ?? "bronze" }
      : { ...BLANK_MODULE }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    setSaving(true);
    setErr(null);
    const url = existing ? `/api/admin/curriculum/modules/${existing.id}` : "/api/admin/curriculum/modules";
    const method = existing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() || null, tier: form.tier }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error ?? "Save failed");
      setSaving(false);
      return;
    }
    onSaved();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
            {existing ? "Edit Module" : "New Module"}
          </p>
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: 0 }}>
            {existing ? existing.title : "Add Module"}
          </p>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={18} /></button>
      </div>

      {err && <p style={{ color: "#ff4444", fontSize: 12, marginBottom: 12 }}>{err}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Module title" />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" } as React.CSSProperties}
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description (optional)"
          />
        </div>
        <div>
          <label style={labelStyle}>Required Tier</label>
          <select style={inputStyle} value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as Tier }))}>
            {TIER_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 5, marginBottom: 0 }}>
            Members with this tier or higher can access this module.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 20px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          <Check size={13} /> {saving ? "Saving..." : existing ? "Save Changes" : "Create Module"}
        </button>
        <button type="button" onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Cancel</button>
      </div>
    </>
  );
}

// ─── Lesson Form ──────────────────────────────────────────────────────────────

function LessonForm({
  moduleId,
  existing,
  onClose,
  onSaved,
}: {
  moduleId: string;
  existing?: Lesson;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    existing
      ? { title: existing.title, notes: existing.notes ?? "", video_id: existing.video_id ?? "" }
      : { title: "", notes: "", video_id: "" }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(existing?.pdf_path ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    setSaving(true);
    setErr(null);
    const payload = {
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      video_id: form.video_id.trim() || null,
      module_id: moduleId,
    };
    const url = existing ? `/api/admin/curriculum/lessons/${existing.id}` : "/api/admin/curriculum/lessons";
    const method = existing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error ?? "Save failed");
      setSaving(false);
      return;
    }
    onSaved();
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !existing) return;
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lessonId", existing.id);
    const res = await fetch("/api/admin/curriculum/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error ?? "Upload failed");
    } else {
      const d = await res.json();
      setPdfPath(d.path);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
            {existing ? "Edit Lesson" : "New Lesson"}
          </p>
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: 0 }}>
            {existing ? existing.title : "Add Lesson"}
          </p>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={18} /></button>
      </div>

      {err && <p style={{ color: "#ff4444", fontSize: 12, marginBottom: 12 }}>{err}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Lesson title" />
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" } as React.CSSProperties}
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Lesson notes or description (optional)"
          />
        </div>
        <div>
          <label style={labelStyle}>YouTube Video ID</label>
          <input
            style={inputStyle}
            value={form.video_id}
            onChange={(e) => setForm((f) => ({ ...f, video_id: e.target.value }))}
            placeholder="e.g. dQw4w9WgXcQ"
          />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 4, marginBottom: 0 }}>
            Paste just the ID from youtube.com/watch?v=<strong>ID</strong>
          </p>
        </div>

        {/* PDF upload — only available when editing an existing lesson (need an ID) */}
        <div>
          <label style={labelStyle}>PDF Resource</label>
          {pdfPath ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.2)" }}>
              <FileText size={14} style={{ color: "#f0c040", flexShrink: 0 }} />
              <span style={{ color: "#f0c040", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>PDF uploaded</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 11 }}
              >
                Replace
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "20px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", cursor: existing ? "pointer" : "not-allowed", opacity: existing ? 1 : 0.4 }}
            >
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
                {existing ? (uploading ? "Uploading..." : "Click to upload PDF") : "Save lesson first, then upload PDF"}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handlePdfUpload}
            disabled={!existing || uploading}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 20px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          <Check size={13} /> {saving ? "Saving..." : existing ? "Save Changes" : "Create Lesson"}
        </button>
        <button type="button" onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Cancel</button>
      </div>
    </>
  );
}
