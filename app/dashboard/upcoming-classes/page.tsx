import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Video, Lock, Clock, Calendar } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { hasAccess, TIER_LABELS } from "@/lib/tier";
import { supabaseAdmin } from "@/lib/supabase";
import type { SessionRow } from "@/lib/supabase";

const DISCORD_INVITE = "https://discord.gg/kxnfaPNC";

const TYPE_COLORS: Record<string, string> = {
  Live: "#00ff88",
  "Live Trading": "#f0c040",
  Coaching: "#c0c0c0",
  Planning: "#cd7f32",
  Workshop: "#a78bfa",
};

export default async function UpcomingClassesPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;

  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("is_active", true)
    .order("day_order", { ascending: true })
    .order("time_est", { ascending: true });

  const classes: SessionRow[] = sessions ?? [];

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Weekly Schedule
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Upcoming Classes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          All sessions run inside the private Discord. Free members can see the schedule — subscribe to join.
        </p>
      </div>

      {!tier && classes.length > 0 && (
        <div style={{ marginBottom: 24, padding: "16px 20px", borderRadius: 14, background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>You&apos;re viewing the schedule as a free member</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Subscribe to join live sessions starting at $200/mo.</p>
          </div>
          <Link href="/pricing" style={{ flexShrink: 0, padding: "10px 24px", borderRadius: 999, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            View Plans →
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {classes.map((cls) => {
          const unlocked = hasAccess(tier, (cls.requires_tier as Tier) ?? null);
          const typeColor = TYPE_COLORS[cls.type] ?? "#00ff88";
          const dayShort = cls.is_recurring
            ? cls.day.slice(0, 3).toUpperCase()
            : cls.scheduled_for
              ? new Date(cls.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : cls.day.slice(0, 3).toUpperCase();

          return (
            <div
              key={cls.id}
              style={{
                padding: "20px 24px",
                borderRadius: 14,
                background: "#111",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {/* Day */}
              <div style={{ width: 64, flexShrink: 0, textAlign: "center", paddingTop: 2 }}>
                <Calendar size={14} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 4 }} />
                <p style={{ color: "#f5f5f5", fontSize: 12, fontWeight: 700, margin: 0 }}>{dayShort}</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0" }}>{cls.is_recurring ? cls.day : "One-time"}</p>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 15, margin: 0 }}>{cls.title}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: typeColor, background: `${typeColor}18`, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
                    {cls.type.toUpperCase()}
                  </span>
                </div>
                {cls.description && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>{cls.description}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.3)" }}>
                  <Clock size={12} />
                  <span style={{ fontSize: 12 }}>{cls.time_est} <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>EST</span></span>
                </div>
              </div>

              {/* Join / Lock */}
              <div style={{ flexShrink: 0, alignSelf: "center" }}>
                {unlocked ? (
                  <a
                    href={cls.discord_link ?? DISCORD_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
                  >
                    <Video size={13} /> Join
                  </a>
                ) : (
                  <Link
                    href="/pricing"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
                  >
                    <Lock size={12} />
                    {cls.requires_tier ? `${TIER_LABELS[cls.requires_tier]}+` : "Upgrade"}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {classes.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "60px 0", fontSize: 14 }}>
            No sessions scheduled yet. Check back soon.
          </p>
        )}
      </div>

      {!tier && (
        <div style={{ marginTop: 32, padding: "24px", borderRadius: 16, background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))", border: "1px solid rgba(0,255,136,0.15)", textAlign: "center" }}>
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>Join live every week</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 20px" }}>Bronze membership gets you into most sessions. Starting at $200/mo.</p>
          <Link href="/pricing" style={{ padding: "12px 32px", borderRadius: 999, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
