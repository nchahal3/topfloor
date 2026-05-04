"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Trophy,
  Calendar,
  Video,
  LogOut,
  Menu,
  X,
  Lock,
  ChevronRight,
} from "lucide-react";
import type { Tier } from "@/lib/tier";
import { TIER_LABELS, TIER_COLORS } from "@/lib/tier";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, badge: null },
  { label: "Funded Accounts", href: "/dashboard/funded-accounts", icon: TrendingUp, badge: "FREE" },
  { label: "Curriculum", href: "/dashboard/curriculum", icon: BookOpen, badge: null },
  { label: "Achievements", href: "/dashboard/achievements", icon: Trophy, badge: "FREE" },
  { label: "Book a Call", href: "/dashboard/book-a-call", icon: Calendar, badge: "FREE" },
  { label: "Upcoming Classes", href: "/dashboard/upcoming-classes", icon: Video, badge: null },
];

export default function DashboardSidebar({ tier }: { tier: Tier }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0d0d0d",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', cursive",
            fontSize: 24,
            color: "#00ff88",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          🔝Floor
        </Link>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>Member Dashboard</p>
      </div>

      {/* Tier badge */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {tier ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: `${TIER_COLORS[tier]}18`,
              border: `1px solid ${TIER_COLORS[tier]}40`,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TIER_COLORS[tier] }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLORS[tier], letterSpacing: "0.08em" }}>
              {TIER_LABELS[tier].toUpperCase()} MEMBER
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
              FREE ACCOUNT
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: "none",
                background: isActive ? "rgba(0,255,136,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(0,255,136,0.15)" : "1px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon
                size={17}
                style={{ color: isActive ? "#00ff88" : "rgba(255,255,255,0.4)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#f5f5f5" : "rgba(255,255,255,0.55)",
                  flex: 1,
                }}
              >
                {item.label}
              </span>
              {item.badge === "FREE" && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#00ff88",
                    background: "rgba(0,255,136,0.1)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    letterSpacing: "0.06em",
                  }}
                >
                  FREE
                </span>
              )}
              {isActive && <ChevronRight size={14} style={{ color: "#00ff88", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      {!tier && (
        <div style={{ padding: "12px 12px" }}>
          <Link
            href="/pricing"
            style={{
              display: "block",
              padding: "12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,255,136,0.05))",
              border: "1px solid rgba(0,255,136,0.2)",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#00ff88", fontWeight: 700, fontSize: 13, margin: 0 }}>Upgrade to Unlock</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "4px 0 0" }}>Plans from $200/mo</p>
          </Link>
        </div>
      )}

      {/* User + logout */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "Member"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar — NOTE: no inline display so lg:hidden can override it */}
      <div
        className="lg:hidden flex items-center justify-between"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#0d0d0d",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 20px",
        }}
      >
        <Link
          href="/"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', cursive", fontSize: 22, color: "#00ff88", textDecoration: "none" }}
        >
          🔝Floor
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#f5f5f5" }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
          className="lg:hidden"
        />
      )}

      {/* Mobile drawer */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden lg:block"
        style={{ width: 240, flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}
      >
        {sidebarContent}
      </div>
    </>
  );
}

export function LockOverlay({ requiredTier }: { requiredTier: Tier }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(4px)",
        borderRadius: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(0,255,136,0.08)",
          border: "1px solid rgba(0,255,136,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Lock size={20} style={{ color: "#00ff88" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 15, margin: 0 }}>
          {requiredTier ? `${TIER_LABELS[requiredTier]}+ Required` : "Subscription Required"}
        </p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "6px 0 0" }}>
          Upgrade your plan to unlock this
        </p>
      </div>
      <Link
        href="/pricing"
        style={{
          marginTop: 4,
          padding: "10px 24px",
          borderRadius: 999,
          background: "#00ff88",
          color: "#000",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        View Plans
      </Link>
    </div>
  );
}
