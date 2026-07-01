import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { TrendingUp, BookOpen, Trophy, Calendar, Video, ArrowRight } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { TIER_LABELS, TIER_COLORS } from "@/lib/tier";
import DiscordStatus from "@/components/dashboard/DiscordStatus";

const FEATURE_CARDS = [
  { label: "Funded Accounts", desc: "Promo codes for Alpha Futures, Lucid & more", href: "/dashboard/funded-accounts", icon: TrendingUp, free: true, comingSoon: false },
  { label: "Curriculum", desc: "The TopFloor team's full trading breakdown sessions", href: "/dashboard/curriculum", icon: BookOpen, free: false, comingSoon: false },
  { label: "Achievements", desc: "Upload your certificates & payout requests", href: "/dashboard/achievements", icon: Trophy, free: true, comingSoon: false },
  { label: "Book a Call", desc: "Schedule a 1-on-1 coaching or trade review", href: "/dashboard/book-a-call", icon: Calendar, free: true, comingSoon: false },
  { label: "Upcoming Classes", desc: "Live trading sessions & class schedule", href: "/dashboard/upcoming-classes", icon: Video, free: false, comingSoon: false },
];

export default async function DashboardPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const suspendedTier = (user?.publicMetadata?.suspendedTier as Tier) ?? null;
  const cancelAt = (user?.publicMetadata?.cancelAt as string) ?? null;
  const name = user?.firstName ?? "Trader";
  const discordUsername = (user?.publicMetadata?.discordUsername as string) ?? null;
  const discordUserId = (user?.publicMetadata?.discordUserId as string) ?? null;
  const gracePeriodEnd = (user?.publicMetadata?.gracePeriodEnd as string) ?? null;

  const cancelDate = cancelAt ? new Date(cancelAt) : null;
  const daysLeft = cancelDate
    ? Math.ceil((cancelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const graceDate = gracePeriodEnd ? new Date(gracePeriodEnd) : null;
  const graceHoursLeft = graceDate
    ? Math.ceil((graceDate.getTime() - Date.now()) / (1000 * 60 * 60))
    : null;
  // If grace period has expired, treat tier as null immediately (cron handles Clerk/Discord cleanup)
  const graceExpired = graceDate ? graceDate < new Date() : false;
  const effectiveTier = graceExpired ? null : tier;

  // Recovery: payment failed and access is now locked (grace expired pre-lock, or the
  // job already suspended their tier). Distinct from a never-subscribed free account -
  // these members must UPDATE THEIR CARD on the billing page, not buy a new plan.
  const isLocked = !effectiveTier;
  const isRecovery = !!suspendedTier || (graceExpired && !!tier);
  const recoveryTier = (tier ?? suspendedTier) as Tier;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100%" }}>
      <div className="px-4 sm:px-8" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
          Member Dashboard
        </p>
        <h1 style={{ color: "#f5f5f5", fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          Welcome back, {name}.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 14 }}>
          Everything you need in one place.
        </p>
      </div>

      {/* Plan status */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          marginBottom: 40,
          background: effectiveTier ? `${TIER_COLORS[effectiveTier]}0d` : isRecovery ? "rgba(255,68,68,0.05)" : "#111",
          border: `1px solid ${effectiveTier ? `${TIER_COLORS[effectiveTier]}30` : isRecovery ? "rgba(255,68,68,0.25)" : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: 0 }}>
            CURRENT PLAN
          </p>
          <p
            style={{
              color: effectiveTier ? TIER_COLORS[effectiveTier] : isRecovery ? "#ff4444" : "#f5f5f5",
              fontSize: 20,
              fontWeight: 700,
              margin: "6px 0 0",
            }}
          >
            {effectiveTier ? `${TIER_LABELS[effectiveTier]} Member` : isRecovery ? "Access Locked" : "Free Account"}
          </p>
          {isLocked && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "4px 0 0" }}>
              {isRecovery
                ? `Your payment failed. Update your card to restore your ${recoveryTier ? TIER_LABELS[recoveryTier] : ""} access.`
                : "Upgrade to unlock live trades, curriculum, and more."}
            </p>
          )}
        </div>
        {isLocked && (
          <Link
            href={isRecovery ? "/dashboard/billing" : "/pricing"}
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              background: isRecovery ? "#ff4444" : "#00ff88",
              color: isRecovery ? "#fff" : "#000",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {isRecovery ? "Restore Access →" : "View Plans →"}
          </Link>
        )}
      </div>

      {/* Grace period warning - payment failed, still within the 24h window */}
      {graceDate && !graceExpired && (
        <div style={{
          padding: "14px 20px",
          borderRadius: 12,
          background: "rgba(255,100,0,0.07)",
          border: "1px solid rgba(255,100,0,0.3)",
          marginBottom: 32,
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
        }}>
          <span style={{ color: "#ff6400", fontWeight: 700 }}>⚠️ Payment failed.</span>{" "}
          You have <strong style={{ color: "#f5f5f5" }}>{graceHoursLeft} hour{graceHoursLeft === 1 ? "" : "s"}</strong> to update your card before your access and Discord role are removed.{" "}
          <a href="/dashboard/billing" style={{ color: "#ff6400", textDecoration: "underline" }}>Update payment →</a>
        </div>
      )}

      {/* Locked after a failed payment - access removed, recoverable by updating the card */}
      {isRecovery && isLocked && (
        <div style={{
          padding: "14px 20px",
          borderRadius: 12,
          background: "rgba(255,68,68,0.07)",
          border: "1px solid rgba(255,68,68,0.3)",
          marginBottom: 32,
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
        }}>
          <span style={{ color: "#ff4444", fontWeight: 700 }}>🔒 Your access is locked.</span>{" "}
          Your payment failed and your membership{recoveryTier ? ` (${TIER_LABELS[recoveryTier]})` : ""} is paused. Update your card to restore full access and your Discord Pro role.{" "}
          <a href="/dashboard/billing" style={{ color: "#ff4444", textDecoration: "underline" }}>Update payment →</a>
        </div>
      )}

      {/* Cancellation notice */}
      {cancelDate && daysLeft !== null && (
        <div style={{
          padding: "14px 20px",
          borderRadius: 12,
          background: "rgba(255,165,0,0.06)",
          border: "1px solid rgba(255,165,0,0.2)",
          marginBottom: 32,
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
        }}>
          Your membership will end on{" "}
          <strong style={{ color: "#ffa500" }}>
            {cancelDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </strong>
          {daysLeft > 0 ? ` - ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining.` : "."}
          {" "}
          <a href="/dashboard/billing" style={{ color: "#ffa500", textDecoration: "underline" }}>Manage billing →</a>
        </div>
      )}

      {/* Discord - paid members only */}
      {effectiveTier ? (
        <DiscordStatus discordUserId={discordUserId} discordUsername={discordUsername} />
      ) : (
        <div style={{
          borderRadius: 16, marginBottom: 40, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)", background: "#111",
          opacity: 0.55,
        }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }} />
          <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
                <svg width="16" height="12" viewBox="0 0 71 55" fill="none" aria-hidden="true"><path d="M60.1 4.9A58.6 58.6 0 0 0 45.6.7a40.7 40.7 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A40.6 40.6 0 0 0 25.7.7 58.5 58.5 0 0 0 11.1 5C1.6 19.4-1 33.4.3 47.2a59 59 0 0 0 18 9.1 43.5 43.5 0 0 0 3.8-6.1 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 35.9 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.1 58.8 58.8 0 0 0 18-9.1c1.5-15.6-2.6-29.5-10.7-42.3ZM23.7 38.7c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z" fill="currentColor"/></svg>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>Discord - Floor Pro Channels</p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0 }}>Active subscription required to connect</p>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.06em" }}>
              LOCKED
            </span>
          </div>
        </div>
      )}

      {/* Lifetime upsell - monthly members only */}
      {effectiveTier && effectiveTier !== "lifetime" && !gracePeriodEnd && !cancelAt && (
        <Link
          href="/dashboard/billing"
          style={{
            display: "block",
            textDecoration: "none",
            marginBottom: 24,
            padding: "20px 24px",
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(240,192,64,0.07) 0%, rgba(240,192,64,0.03) 100%)",
            border: "1px solid rgba(240,192,64,0.25)",
            transition: "border-color 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ color: "#f0c040", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
                ♾ LIFETIME ACCESS
              </p>
              <p style={{ color: "#f5f5f5", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>
                One payment. Never pay again.
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                Lock in permanent access to everything - $2,000 one-time, no renewals.
              </p>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#f0c040", color: "#000",
              fontWeight: 700, fontSize: 13,
              padding: "9px 20px", borderRadius: 999,
              whiteSpace: "nowrap",
            }}>
              Upgrade to Lifetime <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      )}

      {/* Feature grid - 2-col, last card spans full width if count is odd */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ gap: 16 }}
      >
        {FEATURE_CARDS.map((card, i) => {
          const Icon = card.icon;
          const locked = !card.free && !effectiveTier;
          const isLastOdd = i === FEATURE_CARDS.length - 1 && FEATURE_CARDS.length % 2 !== 0;
          return (
            <Link
              key={card.href}
              href={card.comingSoon ? "#" : card.href}
              style={{
                display: "block",
                padding: "20px",
                borderRadius: 16,
                background: "#111",
                border: `1px solid ${locked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}`,
                textDecoration: "none",
                opacity: locked || card.comingSoon ? 0.55 : 1,
                transition: "border-color 0.2s",
                gridColumn: isLastOdd ? "1 / -1" : undefined,
                pointerEvents: card.comingSoon ? "none" : "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: locked ? "rgba(255,255,255,0.04)" : "rgba(0,255,136,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} style={{ color: locked ? "rgba(255,255,255,0.2)" : "#00ff88" }} />
                </div>
                {card.comingSoon ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                    SOON
                  </span>
                ) : locked ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                    LOCKED
                  </span>
                ) : null}
              </div>
              <p style={{ color: locked ? "rgba(255,255,255,0.4)" : "#f5f5f5", fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>{card.label}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: card.comingSoon ? "rgba(255,255,255,0.2)" : locked ? "rgba(255,255,255,0.18)" : "#00ff88" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{card.comingSoon ? "Coming soon" : locked ? "Upgrade to unlock" : "Open"}</span>
                  <ArrowRight size={12} />
                </div>
                {card.free && !card.comingSoon && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                    FREE
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
}
