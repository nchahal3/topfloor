"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink, Star } from "lucide-react";

type Achievement = {
  id: string;
  member_email: string;
  member_name: string | null;
  category: string;
  notes: string | null;
  file_path: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  featured: boolean;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  evaluation_pass: "Evaluation Pass",
  payout_request: "Payout Request",
  account_milestone: "Account Milestone",
  funded_account: "Funded Account Proof",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f0c040", bg: "rgba(240,192,64,0.1)" },
  approved: { label: "Approved", color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
  rejected: { label: "Rejected", color: "#ff4444", bg: "rgba(255,68,68,0.1)" },
};

export default function AchievementsTab() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetch("/api/admin/achievements")
      .then((r) => r.json())
      .then((d) => { setAchievements(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/admin/achievements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_notes: adminNote.trim() || null }),
    });
    if (res.ok) {
      setAchievements((prev) =>
        prev.map((a) => a.id === id ? { ...a, status, admin_notes: adminNote.trim() || null } : a)
      );
      setActionId(null);
      setAdminNote("");
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    const res = await fetch(`/api/admin/achievements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    });
    if (res.ok) {
      setAchievements((prev) => prev.map((a) => a.id === id ? { ...a, featured } : a));
    }
  };

  const filtered = filter === "all" ? achievements : achievements.filter((a) => a.status === filter);
  const pendingCount = achievements.filter((a) => a.status === "pending").length;

  if (loading) return <p style={{ color: "rgba(255,255,255,0.4)", padding: 20 }}>Loading...</p>;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid",
              borderColor: filter === f ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.08)",
              background: filter === f ? "rgba(0,255,136,0.08)" : "transparent",
              color: filter === f ? "#00ff88" : "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : f === "all" ? ` (${achievements.length})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.3)", padding: "20px 0" }}>
          No {filter === "all" ? "" : filter} submissions yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((a) => {
            const status = STATUS_CONFIG[a.status];
            const isApproving = actionId === a.id;
            const isRejecting = actionId === `reject-${a.id}`;

            return (
              <div
                key={a.id}
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                      <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 14, margin: 0 }}>
                        {CATEGORY_LABELS[a.category] ?? a.category}
                      </p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: status.color, background: status.bg, padding: "2px 8px", borderRadius: 4 }}>
                        {status.label}
                      </span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 2px" }}>
                      {a.member_name && <span style={{ color: "#f5f5f5", fontWeight: 600 }}>{a.member_name} · </span>}
                      {a.member_email}
                    </p>
                    {a.notes && (
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "4px 0 0" }}>{a.notes}</p>
                    )}
                    {a.admin_notes && (
                      <p style={{ color: "rgba(255,68,68,0.6)", fontSize: 12, margin: "4px 0 0" }}>Note: {a.admin_notes}</p>
                    )}
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "6px 0 0" }}>
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
                    <a
                      href={`/api/admin/achievements/file-url?path=${encodeURIComponent(a.file_path)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                    >
                      <ExternalLink size={12} /> View File
                    </a>
                    {a.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => toggleFeatured(a.id, !a.featured)}
                        title={a.featured ? "Remove from public Results carousel" : "Show on public Results carousel"}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: a.featured ? "rgba(240,192,64,0.14)" : "rgba(255,255,255,0.05)", border: a.featured ? "1px solid rgba(240,192,64,0.4)" : "1px solid rgba(255,255,255,0.1)", color: a.featured ? "#f0c040" : "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <Star size={12} fill={a.featured ? "#f0c040" : "none"} /> {a.featured ? "Featured" : "Feature"}
                      </button>
                    )}
                    {a.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActionId(isApproving ? null : a.id); setAdminNote(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActionId(isRejecting ? null : `reject-${a.id}`); setAdminNote(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline action confirm */}
                {(isApproving || isRejecting) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <textarea
                      rows={2}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder={isApproving ? "Optional note for member..." : "Reason for rejection (optional)..."}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "#181818", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      {isApproving ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(a.id, "approved")}
                          style={{ padding: "8px 18px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                        >
                          Confirm Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateStatus(a.id, "rejected")}
                          style={{ padding: "8px 18px", borderRadius: 8, background: "#ff4444", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                        >
                          Confirm Reject
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setActionId(null); setAdminNote(""); }}
                        style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
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
