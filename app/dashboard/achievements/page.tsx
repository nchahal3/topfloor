"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, Upload, CheckCircle, Plus } from "lucide-react";

const CATEGORIES = [
  { id: "evaluation_pass", label: "Evaluation Pass", desc: "Prop firm evaluation completion certificates" },
  { id: "payout_request", label: "Payout Request", desc: "Screenshots of your payout confirmations" },
  { id: "account_milestone", label: "Account Milestone", desc: "Hitting profit targets or account goals" },
  { id: "funded_account", label: "Funded Account Proof", desc: "Confirmation of funded account approvals" },
];

type Achievement = {
  id: string;
  category: string;
  notes: string | null;
  file_path: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
};

const STATUS_CONFIG = {
  pending: { label: "Pending Review", color: "#f0c040", bg: "rgba(240,192,64,0.1)" },
  approved: { label: "Approved ✓", color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
  rejected: { label: "Rejected", color: "#ff4444", bg: "rgba(255,68,68,0.1)" },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [panel, setPanel] = useState<string | null>(null);
  const [form, setForm] = useState({ notes: "", review_quote: "", review_role: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => setAchievements(Array.isArray(d) ? d : []));
  }, []);

  const openPanel = (categoryId: string) => {
    setPanel(categoryId);
    setErr(null);
    setPendingFile(null);
    setForm({ notes: "", review_quote: "", review_role: "" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!pendingFile || !panel) return;
    setUploading(true);
    setErr(null);

    const presignRes = await fetch("/api/achievements/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: panel, fileName: pendingFile.name }),
    });
    if (!presignRes.ok) {
      const d = await presignRes.json();
      setErr(d.error ?? "Upload failed");
      setUploading(false);
      return;
    }
    const { signedUrl, path } = await presignRes.json();

    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": pendingFile.type || "application/octet-stream" },
      body: pendingFile,
    });
    if (!uploadRes.ok) {
      setErr("File upload failed - try again");
      setUploading(false);
      return;
    }

    const recordRes = await fetch("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: panel,
        notes: form.notes.trim() || null,
        file_path: path,
        review_quote: form.review_quote.trim() || null,
        review_role: form.review_role.trim() || null,
      }),
    });
    if (!recordRes.ok) {
      const d = await recordRes.json();
      setErr(d.error ?? "Failed to save");
      setUploading(false);
      return;
    }
    const newRecord = await recordRes.json();
    setAchievements((prev) => [newRecord, ...prev]);
    setPanel(null);
    setUploading(false);
  };

  const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    background: "#181818", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11,
    fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6,
  };

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Free for All Members
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Achievements
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          Track your wins. Upload proof and your coach will verify them. Your story may appear on the homepage.
        </p>
      </div>

      {/* Category cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 40 }}>
        {CATEGORIES.map((cat) => {
          const count = achievements.filter((a) => a.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => openPanel(cat.id)}
              style={{ padding: "18px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "left", cursor: "pointer", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <Trophy size={16} style={{ color: "#f0c040" }} />
                {count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "2px 7px", borderRadius: 4 }}>{count}</span>
                )}
              </div>
              <p style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>{cat.label}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{cat.desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#00ff88" }}>
                <Plus size={12} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Upload</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submissions list */}
      {achievements.length > 0 && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>
            Your Submissions ({achievements.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {achievements.map((a) => {
              const cat = categoryById(a.category);
              const status = STATUS_CONFIG[a.status];
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.06)", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 14, margin: 0 }}>{cat?.label ?? a.category}</p>
                    {a.notes && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>{a.notes}</p>}
                    {a.admin_notes && a.status === "rejected" && (
                      <p style={{ color: "rgba(255,68,68,0.7)", fontSize: 12, margin: "4px 0 0" }}>Coach note: {a.admin_notes}</p>
                    )}
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "4px 0 0" }}>
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.bg, padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {panel && (
        <div onClick={() => !uploading && setPanel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px", maxHeight: "90vh", overflowY: "auto" }}>
            <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
              Upload Achievement
            </p>
            <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 20, margin: "0 0 24px" }}>
              {categoryById(panel)?.label}
            </p>

            {err && <p style={{ color: "#ff4444", fontSize: 13, marginBottom: 16 }}>{err}</p>}

            {/* File drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "24px", borderRadius: 14, border: `2px dashed ${pendingFile ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.1)"}`, background: pendingFile ? "rgba(0,255,136,0.04)" : "rgba(255,255,255,0.02)", textAlign: "center", cursor: "pointer", marginBottom: 16, transition: "all 0.2s" }}
            >
              {pendingFile ? (
                <>
                  <CheckCircle size={22} style={{ color: "#00ff88", margin: "0 auto 6px", display: "block" }} />
                  <p style={{ color: "#00ff88", fontWeight: 600, fontSize: 13, margin: "0 0 3px" }}>{pendingFile.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>Click to change</p>
                </>
              ) : (
                <>
                  <Upload size={22} style={{ color: "rgba(255,255,255,0.3)", margin: "0 auto 6px", display: "block" }} />
                  <p style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 13, margin: "0 0 3px" }}>Click to upload</p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>Images or PDFs accepted</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFileSelect} />

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. TopStep evaluation pass - $150k account" style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 12px", lineHeight: 1.5 }}>
                  ✨ Share your experience and it may appear on the homepage when approved.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Your experience (optional)</label>
                    <textarea rows={3} value={form.review_quote} onChange={(e) => setForm((f) => ({ ...f, review_quote: e.target.value }))} placeholder="What has 🔝Floor helped you achieve? Be honest - other traders will see this." style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Your trading style / role (optional)</label>
                    <input value={form.review_role} onChange={(e) => setForm((f) => ({ ...f, review_role: e.target.value }))} placeholder="e.g. Futures Trader, Funded Trader, Day Trader..." style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!pendingFile || uploading}
                style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: pendingFile && !uploading ? "pointer" : "not-allowed", opacity: pendingFile && !uploading ? 1 : 0.5 }}
              >
                {uploading ? "Uploading..." : "Submit Achievement"}
              </button>
              <button type="button" onClick={() => setPanel(null)} disabled={uploading} style={{ padding: "11px 18px", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 14, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
