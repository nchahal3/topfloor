"use client";

import { motion } from "framer-motion";

const AVATAR_COLORS = ["#2a6e4a", "#1a4f6e", "#6e2a4a", "#4a4a2a", "#2a4a6e"];

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Subtle diagonal green gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,255,136,0.06) 0%, transparent 55%)",
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Green radial glow behind text */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70vw",
          height: "50vh",
          background:
            "radial-gradient(ellipse, rgba(0,255,136,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center pt-24 pb-20">
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
          style={{
            background: "rgba(0,255,136,0.08)",
            borderColor: "rgba(0,255,136,0.25)",
            color: "#00ff88",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#00ff88" }}
          />
          <span className="text-sm font-semibold tracking-wide">
            Live Sessions Running Daily
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1 }}
          className="display-font leading-none text-white mb-6"
          style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
        >
          Trade Smarter.
          <br />
          Win Bigger.
          <br />
          Live at the{" "}
          <span className="glow-green" style={{ color: "#00ff88" }}>
            🔝Floor.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-10"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Join 1,200+ traders who are finally trading with a real edge. Live
          sessions, real alerts, and a community that actually shows up.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
        >
          <a
            href="https://discord.gg/kxnfaPNC"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-8 py-4 text-lg"
          >
            Join the Community
          </a>
          <a
            href="#what-you-get"
            onClick={(e) => smoothScroll(e, "#what-you-get")}
            className="btn-outline px-8 py-4 text-lg"
          >
            Watch Free Training
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {AVATAR_COLORS.map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: color,
                  borderColor: "#0a0a0a",
                }}
              />
            ))}
          </div>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span className="font-semibold" style={{ color: "#00ff88" }}>
              1,200+
            </span>{" "}
            members trading live
          </span>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #0a0a0a, transparent)",
        }}
      />
    </section>
  );
}
