"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check,
  ChevronDown as ChevronDownIcon, ChevronRight, FileText, Play, Upload,
} from "lucide-react";

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

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#f0c040", lifetime: "#00ff88",
};
const TIER_OPTIONS = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "lifetime", label: "Lifetime" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  background: "#181818", border: "1px solid rgba(255,255,255,0.1)",
  color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11,
  fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6,
};

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const color = TIER_COLORS[tier] ?? "#f5f5f5";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color,
      background: `${color}18`, border: `1px solid ${color}40`,
      padding: "2px 8px", borderRadius: 4,
      textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0,
    }}>
      {tier}
    </span>
  );
}

function IconBtn({
  onClick, disabled, title, danger, children,
}: {
  onClick: () => void; disabled?: boolean; title?: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      style={{
        background: "none", border: "none", cursor: disabled ? "default" : "pointer",
        color: disabled ? "rgba(255,255,255,0.12)" : danger ? "rgba(255,80,80,0.6)" : "rgba(255,255,255,0.4)",
        padding: "6px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CurriculumTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  type PanelState =
    | { type: "addModule" }
    | { type: "editModule"; module: Module }
    | { type: "addLesson"; moduleId: string }
    | { type: "editLesson"; lesson: Lesson }
    | null;

  const [panel, setPanel] = useState<PanelState>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "module" | "lesson"; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/curriculum/modules");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const mods: Module[] = Array.isArray(data) ? data : [];
      setModules(mods);
      // Default all modules to expanded
      setExpanded((prev) => {
        const next = new Set(prev);
        mods.forEach((m) => next.add(m.id));
        return next;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const reorder = async (type: "module" | "lesson", id: string, direction: "up" | "down") => {
    await fetch("/api/admin/curriculum/reorder", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, direction }),
    });
    await fetchModules();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const url = deleteTarget.kind === "module"
      ? `/api/admin/curriculum/modules/${deleteTarget.id}`
      : `/api/admin/curriculum/lessons/${deleteTarget.id}`;
    await fetch(url, { method: "DELETE" });
    setDeleteTarget(null);
    setDeleting(false);
    await fetchModules();
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "#f5f5f5", fontSize: 20, fontWeight: 700, margin: 0 }}>Curriculum</h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: "3px 0 0" }}>
            {modules.length} module{modules.length !== 1 ? "s" : ""} · {modules.reduce((s, m) => s + m.lessons.length, 0)} lessons
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanel({ type: "addModule" })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
        >
          <Plus size={14} /> Add Module
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff4444", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Loading...</p>
      ) : modules.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 15, margin: "0 0 16px" }}>No modules yet</p>
          <button type="button" onClick={() => setPanel({ type: "addModule" })} style={{ padding: "10px 24px", borderRadius: 9, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + Create your first module
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modules.map((mod, modIdx) => {
            const isExpanded = expanded.has(mod.id);
            const tierColor = mod.tier ? (TIER_COLORS[mod.tier] ?? "#444") : "#444";
            const isDeleting = deleteTarget?.kind === "module" && deleteTarget.id === mod.id;

            return (
              <div key={mod.id} style={{ borderRadius: 14, background: "#111", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", borderTop: `3px solid ${tierColor}` }}>
                {/* Module header */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer" }}
                  onClick={() => toggle(mod.id)}
                >
                  <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                    {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRight size={16} />}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 15 }}>{mod.title}</span>
                      <TierBadge tier={mod.tier} />
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                        {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {mod.description && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
                        {mod.description}
                      </p>
                    )}
                  </div>

                  {/* Actions — stop click propagation so they don't toggle expand */}
                  <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <IconBtn onClick={() => reorder("module", mod.id, "up")} disabled={modIdx === 0} title="Move up"><ChevronUp size={15} /></IconBtn>
                    <IconBtn onClick={() => reorder("module", mod.id, "down")} disabled={modIdx === modules.length - 1} title="Move down"><ChevronDown size={15} /></IconBtn>

                    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPanel({ type: "addLesson", moduleId: mod.id }); setExpanded((p) => { const n = new Set(p); n.add(mod.id); return n; }); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(0,255,136,0.25)", background: "rgba(0,255,136,0.07)", color: "#00ff88", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <Plus size={12} /> Lesson
                    </button>

                    <IconBtn onClick={() => setPanel({ type: "editModule", module: mod })} title="Edit module"><Pencil size={14} /></IconBtn>

                    {isDeleting ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 4 }}>
                        <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: "5px 12px", borderRadius: 7, background: "#ff4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                          {deleting ? "..." : "Delete"}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(null)} style={{ padding: "5px 10px", borderRadius: 7, background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                      </div>
                    ) : (
                      <IconBtn onClick={() => setDeleteTarget({ kind: "module", id: mod.id })} danger title="Delete module"><Trash2 size={14} /></IconBtn>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0d0d0d" }}>
                    {mod.lessons.length === 0 ? (
                      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0, flex: 1 }}>No lessons yet.</p>
                        <button
                          type="button"
                          onClick={() => setPanel({ type: "addLesson", moduleId: mod.id })}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px dashed rgba(0,255,136,0.2)", background: "none", color: "rgba(0,255,136,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          <Plus size={12} /> Add first lesson
                        </button>
                      </div>
                    ) : (
                      mod.lessons.map((lesson, lesIdx) => {
                        const isDeletingLesson = deleteTarget?.kind === "lesson" && deleteTarget.id === lesson.id;
                        return (
                          <div
                            key={lesson.id}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px 12px 28px", borderBottom: lesIdx < mod.lessons.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                          >
                            {/* Number */}
                            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 700, width: 22, textAlign: "right", flexShrink: 0 }}>
                              {String(lesIdx + 1).padStart(2, "0")}
                            </span>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600 }}>{lesson.title}</span>
                                {lesson.pdf_path && (
                                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#f0c040", background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.2)", padding: "2px 7px", borderRadius: 4 }}>
                                    <FileText size={9} /> PDF
                                  </span>
                                )}
                                {lesson.video_id && (
                                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#00ff88", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)", padding: "2px 7px", borderRadius: 4 }}>
                                    <Play size={9} /> Video
                                  </span>
                                )}
                                {!lesson.pdf_path && !lesson.video_id && (
                                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No content yet</span>
                                )}
                              </div>
                              {lesson.pdf_path && (
                                <p style={{ color: "rgba(240,192,64,0.6)", fontSize: 11, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>
                                  📄 {lesson.pdf_path.split("/").pop()}
                                </p>
                              )}
                              {lesson.video_id && (
                                <p style={{ color: "rgba(0,255,136,0.5)", fontSize: 11, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>
                                  🎬 {lesson.video_id.startsWith("https://") ? lesson.video_id : `youtube.com/watch?v=${lesson.video_id}`}
                                </p>
                              )}
                              {lesson.notes && (
                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>
                                  {lesson.notes}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                              <IconBtn onClick={() => reorder("lesson", lesson.id, "up")} disabled={lesIdx === 0}><ChevronUp size={13} /></IconBtn>
                              <IconBtn onClick={() => reorder("lesson", lesson.id, "down")} disabled={lesIdx === mod.lessons.length - 1}><ChevronDown size={13} /></IconBtn>
                              <IconBtn onClick={() => setPanel({ type: "editLesson", lesson })} title="Edit lesson"><Pencil size={13} /></IconBtn>
                              {isDeletingLesson ? (
                                <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 4 }}>
                                  <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: "4px 10px", borderRadius: 6, background: "#ff4444", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                                    {deleting ? "..." : "Delete"}
                                  </button>
                                  <button type="button" onClick={() => setDeleteTarget(null)} style={{ padding: "4px 8px", borderRadius: 6, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                                </div>
                              ) : (
                                <IconBtn onClick={() => setDeleteTarget({ kind: "lesson", id: lesson.id })} danger><Trash2 size={13} /></IconBtn>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {panel && (
        <SidePanel
          panel={panel}
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

function SidePanel({ panel, onClose, onSaved }: { panel: PanelType; onClose: () => void; onSaved: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(500px, 95vw)", height: "100vh", background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", padding: "28px 24px" }}>
        {(panel.type === "addModule" || panel.type === "editModule") && (
          <ModuleForm existing={panel.type === "editModule" ? panel.module : undefined} onClose={onClose} onSaved={onSaved} />
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

function ModuleForm({ existing, onClose, onSaved }: { existing?: Module; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(
    existing
      ? { title: existing.title, description: existing.description ?? "", tier: existing.tier ?? "bronze" as Tier }
      : { title: "", description: "", tier: "bronze" as Tier }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    setSaving(true); setErr(null);
    const url = existing ? `/api/admin/curriculum/modules/${existing.id}` : "/api/admin/curriculum/modules";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() || null, tier: form.tier }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Save failed"); setSaving(false); return; }
    onSaved();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>{existing ? "Edit Module" : "New Module"}</p>
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: 0 }}>{existing ? "Edit Module" : "Add Module"}</p>
        </div>
        <button type="button" onClick={onClose} title="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}><X size={18} /></button>
      </div>

      {err && <p style={{ color: "#ff4444", fontSize: 12, marginBottom: 12 }}>{err}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Trading Foundations" autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, resize: "vertical" } as React.CSSProperties} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description (optional)" />
        </div>
        <div>
          <label style={labelStyle}>Required Tier</label>
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as Tier }))}>
            {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 5 }}>Members at this tier and above can access this module.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 9, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          <Check size={14} /> {saving ? "Saving..." : existing ? "Save Changes" : "Create Module"}
        </button>
        <button type="button" onClick={onClose} style={{ padding: "10px 16px", borderRadius: 9, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Cancel</button>
      </div>
    </>
  );
}

// ─── Lesson Form ──────────────────────────────────────────────────────────────

function LessonForm({ moduleId, existing, onClose, onSaved }: { moduleId: string; existing?: Lesson; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(
    existing
      ? { title: existing.title, notes: existing.notes ?? "", video_id: existing.video_id ?? "" }
      : { title: "", notes: "", video_id: "" }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(existing?.pdf_path ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPdf = async (lessonId: string, file: File) => {
    setUploading(true);
    // Step 1: get a signed URL — bypasses Vercel's 4.5MB body limit
    const presignRes = await fetch("/api/admin/curriculum/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (!presignRes.ok) {
      const d = await presignRes.json();
      setErr(d.error ?? "Failed to prepare upload");
      setUploading(false);
      return;
    }
    const { signedUrl, path } = await presignRes.json();
    // Step 2: upload the file directly to Supabase (no Vercel size limit)
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: file,
    });
    if (uploadRes.ok) {
      setPdfPath(path);
    } else {
      setErr("PDF upload failed — try again");
    }
    setUploading(false);
  };

  const parseVideoInput = (raw: string): string | null => {
    const s = raw.trim();
    if (!s) return null;
    // Google Drive share link → extract file ID and store embed URL
    const driveMatch = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    // YouTube full URL → extract video ID
    const ytMatch = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return ytMatch[1];
    // Already a raw YouTube ID or stored embed URL
    return s;
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    setSaving(true); setErr(null);
    const payload = { title: form.title.trim(), notes: form.notes.trim() || null, video_id: parseVideoInput(form.video_id), module_id: moduleId };
    const url = existing ? `/api/admin/curriculum/lessons/${existing.id}` : "/api/admin/curriculum/lessons";
    const res = await fetch(url, { method: existing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Save failed"); setSaving(false); return; }

    // Upload pending PDF if any
    if (pendingFile) {
      const lessonId = existing?.id ?? (await res.json().catch(() => null))?.id;
      if (lessonId) await uploadPdf(lessonId, pendingFile);
      // Re-fetch saved lesson to get ID for new lessons
      else {
        const saved = await fetch(url.replace("/api/admin/curriculum/lessons", "/api/admin/curriculum/lessons")).catch(() => null);
        void saved;
      }
    }

    onSaved();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (existing) {
      // Already has ID — upload immediately
      await uploadPdf(existing.id, file);
    } else {
      // No ID yet — stage for upload after save
      setPendingFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasPdf = !!pdfPath || !!pendingFile;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>{existing ? "Edit Lesson" : "New Lesson"}</p>
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: 0 }}>{existing ? existing.title : "Add Lesson"}</p>
        </div>
        <button type="button" onClick={onClose} title="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}><X size={18} /></button>
      </div>

      {err && <p style={{ color: "#ff4444", fontSize: 12, marginBottom: 12 }}>{err}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Lesson Title</label>
          <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Understanding Market Structure" autoFocus />
        </div>

        <div>
          <label style={labelStyle}>Notes / Description</label>
          <textarea style={{ ...inputStyle, resize: "vertical" } as React.CSSProperties} rows={4} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="What will members learn in this lesson? (optional)" />
        </div>

        {/* PDF Upload */}
        <div>
          <label style={labelStyle}>PDF Resource</label>
          {hasPdf ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 9, background: "rgba(240,192,64,0.07)", border: "1px solid rgba(240,192,64,0.2)" }}>
              <FileText size={16} style={{ color: "#f0c040", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: "#f0c040", fontSize: 13, fontWeight: 600, margin: 0 }}>
                  {pendingFile ? pendingFile.name : "PDF uploaded ✓"}
                </p>
                {pendingFile && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0" }}>Will upload when you save</p>}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 11, padding: "4px 10px", borderRadius: 6 }}>
                Replace
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "24px", borderRadius: 9, border: "2px dashed rgba(255,255,255,0.1)", textAlign: "center", cursor: uploading ? "wait" : "pointer", transition: "border-color 0.15s" }}
            >
              <Upload size={22} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 8 }} />
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>
                {uploading ? "Uploading..." : "Click to upload PDF"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>PDF files only</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="application/pdf" aria-label="Upload PDF" style={{ display: "none" }} onChange={handleFileSelect} disabled={uploading} />
        </div>

        {/* Video Link */}
        <div>
          <label style={labelStyle}>Video Link</label>
          <input style={inputStyle} value={form.video_id} onChange={(e) => setForm((f) => ({ ...f, video_id: e.target.value }))} placeholder="YouTube URL, Google Drive share link, or YouTube video ID" />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 5 }}>
            Paste a YouTube link, Google Drive share link, or just the YouTube video ID
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <button type="button" onClick={handleSave} disabled={saving || uploading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 9, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: (saving || uploading) ? 0.6 : 1 }}>
          <Check size={14} /> {saving ? "Saving..." : uploading ? "Uploading PDF..." : existing ? "Save Changes" : "Create Lesson"}
        </button>
        <button type="button" onClick={onClose} style={{ padding: "10px 16px", borderRadius: 9, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Cancel</button>
      </div>
    </>
  );
}
