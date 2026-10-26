import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TopFloor - Elite Day Trading Coaching";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          position: "relative",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Green glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 700,
            color: "#00ff88",
            marginBottom: 32,
            letterSpacing: "-0.02em",
          }}
        >
          <span>🔝Floor</span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: 900,
            marginBottom: 28,
          }}
        >
          <span style={{ color: "#f5f5f5" }}>Trade Smarter.</span>
          <span style={{ color: "#00ff88" }}>Win Bigger.</span>
        </div>

        {/* Subline */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 48,
          }}
        >
          <span>Live sessions · Private Discord · 1-on-1 mentorship</span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 48 }}>
          {[
            { value: "1,200+", label: "Students" },
            { value: "87%", label: "Win Rate" },
            { value: "$4.2M+", label: "Community Profits" },
          ].map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#f0c040" }}>{stat.value}</span>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #00ff88, #f0c040, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
