"use client";

import { useState } from "react";
import { X, CalendarDays, AlertTriangle, TrendingUp, Users, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import BookingsTab from "./BookingsTab";
import { useToast } from "@/lib/toast-context";

const ITEMS_PER_PAGE = 25;

export type Member = {
  id: string;
  clerkUserId: string | null;
  clerkTier: string | null;
  name: string;
  email: string;
  phone: string;
  discord: string;
  plan: string;
  status: string;
  nextPayment: string;
  joinedAt: string;
  subscriptionId: string | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:   { bg: "rgba(0,255,136,0.15)",   color: "#00ff88" },
  lifetime: { bg: "rgba(240,192,64,0.15)",  color: "#f0c040" },
  canceled: { bg: "rgba(255,68,68,0.15)",   color: "#ff4444" },
  past_due: { bg: "rgba(255,165,0,0.15)",   color: "#ffa500" },
  paid:     { bg: "rgba(0,255,136,0.15)",   color: "#00ff88" },
  free:     { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" },
};

const FILTER_TABS = ["all", "active", "free", "past_due", "canceled", "lifetime"];


function parseMRR(plan: string): number {
  if (!plan.includes("/mo")) return 0;
  const match = plan.match(/\$(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function paymentDateStyle(dateStr: string): React.CSSProperties {
  if (dateStr === "—") return { color: "rgba(255,255,255,0.35)" };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { color: "rgba(255,255,255,0.35)" };
  const daysUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return { color: "#ff4444", fontWeight: 700 };
  if (daysUntil <= 7) return { color: "#ffa500", fontWeight: 600 };
  return { color: "rgba(255,255,255,0.55)" };
}

function daysLeftLabel(member: Member): { text: string; color: string } {
  if (member.status === "lifetime") return { text: "Lifetime", color: "#f0c040" };
  if (member.status === "free") return { text: "Free", color: "rgba(255,255,255,0.3)" };
  if (member.nextPayment === "—" || !member.nextPayment) return { text: "—", color: "rgba(255,255,255,0.25)" };
  if (member.status === "canceled") return { text: "Cancelled", color: "#ff4444" };
  const date = new Date(member.nextPayment);
  if (isNaN(date.getTime())) return { text: "—", color: "rgba(255,255,255,0.25)" };
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: "Overdue", color: "#ff4444" };
  if (days === 0) return { text: "Today", color: "#ff4444" };
  if (days === 1) return { text: "1 day", color: "#ffa500" };
  if (days <= 7) return { text: `${days} days`, color: "#ffa500" };
  return { text: `${days} days`, color: "#00ff88" };
}

export default function MembersTab({ members, onDelete }: { members: Member[]; onDelete?: () => void }) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filter, setFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [cancelConfirm, setCancelConfirm] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deletedEmails, setDeletedEmails] = useState<Set<string>>(new Set());
  const [tierValue, setTierValue] = useState("none");
  const [tierConfirm, setTierConfirm] = useState(false);
  const [tierChanging, setTierChanging] = useState(false);
  const [overrideTiers, setOverrideTiers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const nonDeleted = members.filter((m) => !deletedEmails.has(m.email));

  const planOptions = ["all", ...Array.from(new Set(nonDeleted.map((m) => m.plan))).sort()];

  const filtered = nonDeleted.filter((m) => {
    const statusMatch = filter === "all" || m.status === filter;
    const planMatch = planFilter === "all" || m.plan === planFilter;
    return statusMatch && planMatch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const changeFilter = (next: string) => { setFilter(next); setPage(0); };
  const changePlanFilter = (next: string) => { setPlanFilter(next); setPage(0); };

  const activeSubs = nonDeleted.filter((m) => m.status === "active" || m.status === "paid");
  const freeCount = nonDeleted.filter((m) => m.status === "free").length;
  const mrr = activeSubs.reduce((sum, m) => sum + parseMRR(m.plan), 0);
  const pastDue = nonDeleted.filter((m) => m.status === "past_due").length;

  const handleDelete = async (member: Member) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: member.clerkUserId ?? undefined, email: member.email }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.error ?? "Failed to delete user.", "error");
      } else {
        setDeletedEmails((prev) => new Set([...prev, member.email]));
        setSelectedMember(null);
        onDelete?.();
        toast(`${member.name} has been deleted.`);
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    }
    setDeleteConfirm(0);
    setDeleting(false);
  };

  const openMember = (m: Member) => {
    const current = overrideTiers[m.id] ?? m.clerkTier ?? "none";
    setTierValue(current);
    setTierConfirm(false);
    setCancelConfirm(0);
    setDeleteConfirm(0);
    setSelectedMember(m);
  };

  const handleTierChange = async (member: Member) => {
    setTierChanging(true);
    try {
      const res = await fetch("/api/admin/members/tier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: member.clerkUserId, tier: tierValue === "none" ? null : tierValue, subscriptionId: member.subscriptionId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.error ?? "Failed to update tier.", "error");
      } else {
        setOverrideTiers((prev) => ({ ...prev, [member.id]: tierValue }));
        setTierConfirm(false);
        toast(`${member.name}'s tier updated to ${tierValue === "none" ? "No Access" : tierValue.charAt(0).toUpperCase() + tierValue.slice(1)}.`);
      }
    } catch {
      toast("Something went wrong.", "error");
    }
    setTierChanging(false);
  };

  const handleCancel = async (member: Member) => {
    if (!member.subscriptionId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/members/${member.subscriptionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", clerkUserId: member.clerkUserId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.error ?? "Failed to cancel subscription.", "error");
      } else {
        setCancelledIds((prev) => new Set([...prev, member.id]));
        setSelectedMember((prev) => prev ? { ...prev, status: "canceled" } : null);
        toast(`${member.name}'s subscription cancelled.`);
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    }
    setCancelConfirm(0);
    setCancelling(false);
  };

  const statCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <div style={{ flex: 1, minWidth: 120, padding: "16px 18px", borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: "#f5f5f5", fontSize: 22, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  );

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {statCard(<Users size={16} />, "Total Members", nonDeleted.length, "#00ff88")}
        {statCard(<TrendingUp size={16} />, "Active Subs", activeSubs.length, "#00ff88")}
        {statCard(<Users size={16} />, "Free Members", freeCount, "rgba(255,255,255,0.4)")}
        {statCard(<DollarSign size={16} />, "Est. MRR", `$${mrr.toLocaleString()}`, "#f0c040")}
        {statCard(<AlertTriangle size={16} />, "Past Due", pastDue, pastDue > 0 ? "#ffa500" : "rgba(255,255,255,0.3)")}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: 0 }}>All Members</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            aria-label="Filter by plan"
            value={planFilter}
            onChange={(e) => changePlanFilter(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: planFilter === "all" ? "rgba(255,255,255,0.4)" : "#f0c040", fontSize: 12, fontWeight: 600, outline: "none", cursor: "pointer" }}
          >
            {planOptions.map((p) => (
              <option key={p} value={p}>{p === "all" ? "All Plans" : p}</option>
            ))}
          </select>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{filtered.length} shown</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTER_TABS.map((tab) => {
          const count = tab === "all" ? nonDeleted.length : nonDeleted.filter((m) => m.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => changeFilter(tab)}
              style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                textTransform: "capitalize",
                border: `1px solid ${filter === tab ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: filter === tab ? "rgba(0,255,136,0.08)" : "transparent",
                color: filter === tab ? "#00ff88" : "rgba(255,255,255,0.4)",
              }}
            >
              {tab.replace("_", " ")} {count > 0 && <span style={{ opacity: 0.6 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#111" }}>
              {["Name", "Email", "Discord", "Plan", "Status", "Next Payment", "Days Left", "Joined", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.35)", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.05em", fontSize: 11, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((m, i) => {
              const isCancelled = cancelledIds.has(m.id);
              const displayStatus = isCancelled ? "canceled" : m.status;
              const ss = STATUS_STYLE[displayStatus] ?? STATUS_STYLE.active;
              return (
                <tr key={m.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "#0a0a0a" : "#0d0d0d", opacity: displayStatus === "canceled" ? 0.5 : 1 }}>
                  <td style={{ padding: "12px 16px", color: "#f5f5f5", fontWeight: 500, whiteSpace: "nowrap" }}>{m.name}</td>
                  <td style={{ padding: "12px 16px", color: "#00ff88" }}>{m.email}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.65)" }}>{m.discord}</td>
                  <td style={{ padding: "12px 16px", color: "#f0c040", fontWeight: 600, whiteSpace: "nowrap" }}>{m.plan}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>
                      {displayStatus.toUpperCase()}
                    </span>
                    {m.plan !== "Free" && displayStatus === "free" && (
                      <span style={{ display: "block", marginTop: 4, fontSize: 10, fontWeight: 600, color: "#ff4444" }}>
                        access revoked
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap", ...paymentDateStyle(m.nextPayment) }}>{m.nextPayment}</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {(() => { const d = daysLeftLabel(isCancelled ? { ...m, status: "canceled" } : m); return <span style={{ fontWeight: 600, fontSize: 12, color: d.color }}>{d.text}</span>; })()}
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{m.joinedAt}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      type="button"
                      onClick={() => openMember(m)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.06)", color: "#00ff88", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      <CalendarDays size={12} /> Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "60px 0" }}>No members in this category.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "0 4px" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "5px 12px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Slide-out panel */}
      {selectedMember && (
        <div
          onClick={() => { setSelectedMember(null); setCancelConfirm(0); setDeleteConfirm(0); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(560px, 95vw)", height: "100vh", background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", padding: 24 }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Member</p>
                <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 17, margin: "0 0 2px" }}>{selectedMember.name}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 2px" }}>{selectedMember.email}</p>
                <p style={{ color: "#f0c040", fontSize: 12, fontWeight: 600, margin: 0 }}>{selectedMember.plan}</p>
              </div>
              <button type="button" onClick={() => { setSelectedMember(null); setCancelConfirm(0); setDeleteConfirm(0); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                <X size={20} />
              </button>
            </div>

            {/* Membership info card */}
            <div style={{ background: "#111", borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", margin: "0 0 3px" }}>Status</p>
                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, ...(STATUS_STYLE[cancelledIds.has(selectedMember.id) ? "canceled" : selectedMember.status] ?? STATUS_STYLE.active) }}>
                  {(cancelledIds.has(selectedMember.id) ? "canceled" : selectedMember.status).toUpperCase()}
                </span>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", margin: "0 0 3px" }}>Next Payment</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, ...paymentDateStyle(selectedMember.nextPayment) }}>{selectedMember.nextPayment}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", margin: "0 0 3px" }}>Phone</p>
                <p style={{ color: "#f5f5f5", fontSize: 13, margin: 0 }}>{selectedMember.phone}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", margin: "0 0 3px" }}>Discord</p>
                <p style={{ color: "#f5f5f5", fontSize: 13, margin: 0 }}>{selectedMember.discord}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", margin: "0 0 3px" }}>Joined</p>
                <p style={{ color: "#f5f5f5", fontSize: 13, margin: 0 }}>{selectedMember.joinedAt}</p>
              </div>
            </div>

            {/* Change Tier */}
            <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(240,192,64,0.03)", border: "1px solid rgba(240,192,64,0.15)" }}>
              <p style={{ color: "#f0c040", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>Change Tier</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 12px" }}>Manually override this member's access level. Takes effect immediately.</p>

              {selectedMember.status === "lifetime" && (
                <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}>
                  <p style={{ color: "#ffa500", fontSize: 12, fontWeight: 600, margin: 0 }}>⚠ This member paid for lifetime access. Removing access will revoke their permanent membership.</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  aria-label="Select tier"
                  value={tierValue}
                  onChange={(e) => { setTierValue(e.target.value); setTierConfirm(false); }}
                  style={{ padding: "7px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#f5f5f5", fontSize: 13, fontWeight: 600, outline: "none", cursor: "pointer" }}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="lifetime">Lifetime</option>
                  <option value="none">Remove Access</option>
                </select>
                {!tierConfirm ? (
                  <button type="button" onClick={() => setTierConfirm(true)} style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.3)", color: "#f0c040", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Apply Change
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                      Set to <strong style={{ color: tierValue === "none" ? "#ff4444" : "#f0c040" }}>{tierValue === "none" ? "No Access" : tierValue.charAt(0).toUpperCase() + tierValue.slice(1)}</strong>?
                    </span>
                    <button type="button" onClick={() => handleTierChange(selectedMember)} disabled={tierChanging} style={{ padding: "6px 14px", borderRadius: 8, background: "#f0c040", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: tierChanging ? 0.6 : 1 }}>
                      {tierChanging ? "Saving..." : "Confirm"}
                    </button>
                    <button type="button" onClick={() => setTierConfirm(false)} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel membership */}
            {selectedMember.subscriptionId && !cancelledIds.has(selectedMember.id) && selectedMember.status !== "canceled" && (
              <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(255,68,68,0.04)", border: "1px solid rgba(255,68,68,0.15)" }}>
                <p style={{ color: "#ff4444", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>Cancel Membership</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 12px" }}>This immediately cancels their Stripe subscription. Access ends now.</p>
                {cancelConfirm === 0 && (
                  <button type="button" onClick={() => setCancelConfirm(1)} style={{ padding: "7px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,68,68,0.4)", color: "#ff4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Cancel Subscription
                  </button>
                )}
                {cancelConfirm === 1 && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)" }}>
                    <p style={{ color: "#ffa500", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>⚠ Are you sure? This will immediately revoke their access.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => setCancelConfirm(2)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.4)", color: "#ff4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Yes, continue</button>
                      <button type="button" onClick={() => setCancelConfirm(0)} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Go back</button>
                    </div>
                  </div>
                )}
                {cancelConfirm === 2 && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.35)" }}>
                    <p style={{ color: "#ff4444", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>Final confirmation — this cannot be undone.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => handleCancel(selectedMember)} disabled={cancelling} style={{ padding: "6px 14px", borderRadius: 8, background: "#ff4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: cancelling ? 0.6 : 1 }}>
                        {cancelling ? "Cancelling..." : "Confirm Cancel"}
                      </button>
                      <button type="button" onClick={() => setCancelConfirm(0)} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Go back</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete user */}
            {!deletedEmails.has(selectedMember.email) && (() => {
              const hasActiveSub = (
                !cancelledIds.has(selectedMember.id) &&
                selectedMember.status !== "canceled" &&
                selectedMember.status !== "free" &&
                selectedMember.status !== "lifetime" &&
                !!selectedMember.subscriptionId
              );
              return (
                <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(255,68,68,0.03)", border: `1px solid ${hasActiveSub ? "rgba(255,165,0,0.2)" : "rgba(255,68,68,0.1)"}` }}>
                  <p style={{ color: "#ff4444", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>Delete Account</p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 12px" }}>Permanently removes this user from Clerk. This cannot be undone.</p>
                  {hasActiveSub ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button type="button" disabled style={{ padding: "7px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,68,68,0.15)", color: "rgba(255,68,68,0.3)", fontSize: 12, fontWeight: 700, cursor: "not-allowed" }}>
                        Delete User
                      </button>
                      <p style={{ color: "#ffa500", fontSize: 12, margin: 0 }}>
                        ⚠ Cancel their subscription first
                      </p>
                    </div>
                  ) : deleteConfirm === 0 ? (
                    <button type="button" onClick={() => setDeleteConfirm(1)} style={{ padding: "7px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,68,68,0.35)", color: "#ff4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Delete User
                    </button>
                  ) : deleteConfirm === 1 ? (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)" }}>
                      <p style={{ color: "#ffa500", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>⚠ Are you sure? This will permanently delete their account.</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setDeleteConfirm(2)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.4)", color: "#ff4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Yes, continue</button>
                        <button type="button" onClick={() => setDeleteConfirm(0)} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Go back</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.35)" }}>
                      <p style={{ color: "#ff4444", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>Final confirmation — this is permanent and cannot be undone.</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => handleDelete(selectedMember)} disabled={deleting} style={{ padding: "6px 14px", borderRadius: 8, background: "#ff4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                          {deleting ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(0)} style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Go back</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bookings */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
              <BookingsTab filterEmail={selectedMember.email} />
            </div>

            <AdminCreateBooking memberEmail={selectedMember.email} memberName={selectedMember.name} />
          </div>
        </div>
      )}
    </>
  );
}

function AdminCreateBooking({ memberEmail, memberName }: { memberEmail: string; memberName: string }) {
  const [open, setOpen] = useState(false);
  const [callType, setCallType] = useState("intro");
  const [preferredTime, setPreferredTime] = useState("");
  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_email: memberEmail,
        member_name: memberName,
        call_type: callType,
        preferred_time: preferredTime,
        topic: topic || null,
        status,
        scheduled_at: scheduledAt || null,
      }),
    });
    setOpen(false);
    setPreferredTime("");
    setTopic("");
    setScheduledAt("");
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(0,255,136,0.3)", background: "rgba(0,255,136,0.06)", color: "#00ff88", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Schedule a Call for This Member
        </button>
      ) : (
        <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid rgba(0,255,136,0.15)" }}>
          <p style={{ color: "#00ff88", fontWeight: 700, fontSize: 13, margin: "0 0 14px" }}>Schedule Call for {memberName}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Call Type</label>
              <select style={inputStyle} value={callType} onChange={(e) => setCallType(e.target.value)}>
                <option value="intro">Intro Call</option>
                <option value="trade_review">Trade Review</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Scheduled For</label>
              <input type="datetime-local" style={inputStyle} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Preferred Time</label>
              <input style={inputStyle} value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} placeholder="e.g. Thursday 3pm EST" />
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Topic</label>
              <input style={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional topic/notes" />
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Status</label>
              <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="button" onClick={handleCreate} disabled={saving || !preferredTime} style={{ padding: "8px 18px", borderRadius: 8, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Create Booking"}
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
