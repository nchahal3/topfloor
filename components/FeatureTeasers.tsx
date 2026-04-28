"use client";

import Link from "next/link";
import { TrendingUp, BookOpen, Users, Video, ArrowRight } from "lucide-react";

const FEATURE_TEASERS = [
  { icon: BookOpen, label: "Curriculum", desc: "5+ hours of coaching content from Coach Floor.", href: "/features" },
  { icon: Video, label: "Live Sessions", desc: "Weekly live trades and market breakdowns.", href: "/results" },
  { icon: TrendingUp, label: "Get Funded", desc: "Exclusive promo codes for top prop firms.", href: "/funded-accounts" },
  { icon: Users, label: "Community", desc: "Private Discord with daily signals and alerts.", href: "/features" },
];

export default function FeatureTeasers() {
  return (
    <section style={{ background: "#0d0d0d", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Everything You Need
          </p>
          <h2 className="display-font" style={{ color: "#f5f5f5", fontSize: "clamp(36px, 6vw, 60px)", margin: 0, lineHeight: 1 }}>
            Built for Serious Traders
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {FEATURE_TEASERS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{ display: "block", padding: "24px", borderRadius: 16, background: "#111", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,255,136,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={18} style={{ color: "#00ff88" }} />
                </div>
                <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>{item.label}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>{item.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#00ff88" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Learn more</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
