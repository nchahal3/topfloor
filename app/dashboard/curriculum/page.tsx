import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Play, Lock } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { hasAccess } from "@/lib/tier";

const MODULES = [
  {
    id: 1,
    title: "Welcome to 🔝Floor — What to Expect",
    desc: "Coach Floor walks you through the platform, what you'll learn, and how to get the most out of your membership.",
    duration: "12 min",
    requiredTier: null,
    videoId: "dQw4w9WgXcQ", // placeholder — replace with real YouTube ID
    free: true,
  },
  {
    id: 2,
    title: "The 🔝Floor Trading Model — Full Breakdown Pt. 1",
    desc: "Market structure, liquidity zones, and how Coach Floor identifies high-probability setups every morning.",
    duration: "58 min",
    requiredTier: "bronze" as Tier,
    videoId: null,
  },
  {
    id: 3,
    title: "The 🔝Floor Trading Model — Full Breakdown Pt. 2",
    desc: "Entries, stop placement, and risk management. The exact system used in every live session.",
    duration: "72 min",
    requiredTier: "bronze" as Tier,
    videoId: null,
  },
  {
    id: 4,
    title: "Reading the Tape — Order Flow Basics",
    desc: "How to read time & sales, identify iceberg orders, and trade with institutional flow.",
    duration: "45 min",
    requiredTier: "silver" as Tier,
    videoId: null,
  },
  {
    id: 5,
    title: "Live Trade Breakdown — Best Setups of the Month",
    desc: "Real trades. Real P&L. Coach Floor breaks down his top setups from the past 30 days.",
    duration: "90 min",
    requiredTier: "silver" as Tier,
    videoId: null,
  },
  {
    id: 6,
    title: "Advanced Concepts — Scaling Into Winners",
    desc: "Position sizing, scaling strategies, and how to squeeze maximum return from A+ setups.",
    duration: "55 min",
    requiredTier: "gold" as Tier,
    videoId: null,
  },
  {
    id: 7,
    title: "Psychology & Discipline — The Mental Edge",
    desc: "The real reason most traders fail — and the exact framework Coach Floor uses to stay consistent.",
    duration: "40 min",
    requiredTier: "gold" as Tier,
    videoId: null,
  },
];

const TIER_LABELS: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", lifetime: "Lifetime" };

export default async function CurriculumPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Coaching Content
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Curriculum
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          Over 5 hours of coaching content. Start with the free intro, then unlock the full system with a membership.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MODULES.map((mod) => {
          const unlocked = hasAccess(tier, mod.requiredTier ?? null);
          return (
            <div
              key={mod.id}
              style={{
                padding: "20px 24px",
                borderRadius: 14,
                background: "#111",
                border: `1px solid ${unlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: unlocked ? 1 : 0.55,
              }}
            >
              {/* Number */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: unlocked ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${unlocked ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.06)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {unlocked ? (
                  <Play size={14} style={{ color: "#00ff88" }} />
                ) : (
                  <Lock size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <p style={{ color: unlocked ? "#f5f5f5" : "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 14, margin: 0 }}>
                    {mod.title}
                  </p>
                  {mod.free && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.06em", flexShrink: 0 }}>
                      FREE
                    </span>
                  )}
                </div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{mod.desc}</p>
              </div>

              {/* Right side */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                {unlocked ? (
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{mod.duration}</span>
                ) : (
                  <Link
                    href="/#pricing"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#00ff88",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mod.requiredTier ? `${TIER_LABELS[mod.requiredTier]}+` : "Upgrade"} →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!tier && (
        <div
          style={{
            marginTop: 32,
            padding: "24px",
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))",
            border: "1px solid rgba(0,255,136,0.15)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>
            Unlock the full 5-hour coaching series
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 20px" }}>
            Bronze membership starts at $200/mo. Cancel anytime.
          </p>
          <Link
            href="/#pricing"
            style={{
              padding: "12px 32px",
              borderRadius: 999,
              background: "#00ff88",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
