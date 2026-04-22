"use client";

import { motion } from "framer-motion";

const CREDENTIALS = [
  { icon: "📈", label: "7+ Years Trading" },
  { icon: "✅", label: "1,200+ Students" },
  { icon: "🏆", label: "87% Win Rate" },
];

export default function About() {
  return (
    <section
      id="about"
      className="py-20 sm:py-28"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Coach photo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div
              className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-sm mx-auto lg:mx-0 flex items-center justify-center border"
              style={{
                background: "linear-gradient(135deg, #0f1a14 0%, #0a1510 100%)",
                borderColor: "rgba(0,255,136,0.2)",
              }}
            >
              {/* Green glow in corner */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)",
                }}
              />
              <div className="text-center px-8">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 display-font text-3xl"
                  style={{
                    background: "rgba(0,255,136,0.1)",
                    borderColor: "rgba(0,255,136,0.4)",
                    color: "#00ff88",
                  }}
                >
                  CF
                </div>
                <p
                  className="display-font text-2xl"
                  style={{ color: "#00ff88" }}
                >
                  Coach Floor
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Professional Day Trader
                </p>
              </div>

              {/* Stats overlay badge */}
              <div
                className="absolute bottom-6 left-6 right-6 rounded-xl p-4 border"
                style={{
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(8px)",
                  borderColor: "rgba(0,255,136,0.15)",
                }}
              >
                <div className="flex justify-between">
                  <div className="text-center">
                    <p
                      className="display-font text-2xl"
                      style={{ color: "#00ff88" }}
                    >
                      $5K
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Started With
                    </p>
                  </div>
                  <div
                    className="w-px"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                  <div className="text-center">
                    <p
                      className="display-font text-2xl"
                      style={{ color: "#f0c040" }}
                    >
                      6-FIG
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Achieved
                    </p>
                  </div>
                  <div
                    className="w-px"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                  <div className="text-center">
                    <p
                      className="display-font text-2xl"
                      style={{ color: "#00ff88" }}
                    >
                      7 YRS
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bio content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p
              className="text-xs font-bold tracking-widest uppercase mb-4"
              style={{ color: "#00ff88" }}
            >
              Meet Your Coach
            </p>
            <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-6">
              I Turned $5K Into{" "}
              <span style={{ color: "#f0c040" }}>Six Figures</span> —{" "}
              <br className="hidden sm:block" />
              Now I&apos;m Showing You How.
            </h2>
            <p
              className="text-base sm:text-lg leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Coach Floor has been trading full-time for over 7 years across
              futures, options, and momentum stocks. He started with $5,000 and
              built it into a six-figure account. Not through luck or some
              secret formula, but by developing a process that actually works in
              real market conditions. He started 🔝Floor because the good
              information shouldn&apos;t be locked behind a hedge fund paywall.
            </p>
            <p
              className="text-base leading-relaxed mb-10"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              No fluff. No overnight-millionaire promises. Just battle-tested
              setups, live execution, and a community that holds you
              accountable every single trading day.
            </p>

            {/* Credential chips */}
            <div className="flex flex-wrap gap-3">
              {CREDENTIALS.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
                  style={{
                    background: "rgba(0,255,136,0.06)",
                    borderColor: "rgba(0,255,136,0.2)",
                    color: "#f5f5f5",
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
