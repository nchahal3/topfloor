"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const CREDENTIALS = [
  { icon: "📈", label: "7+ Years in the Markets" },
  { icon: "✅", label: "Live Sessions Every Day" },
  { icon: "🏆", label: "87% Member Win Rate" },
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
              <div className="text-center px-8 pb-20">
                <div
                  className="mx-auto mb-5"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 40px rgba(240,192,64,0.15)",
                  }}
                >
                  <Image
                    src="/Logo.png"
                    alt="TopFloor Trades Logo"
                    width={190}
                    height={190}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <p
                  className="display-font text-2xl"
                  style={{ color: "#f0c040" }}
                >
                  TopFloor Team
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Built for Struggling Traders
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
                      DAILY
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Live Sessions
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
                      $4.2M+
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Community Profits
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
                      87%
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Win Rate
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
              Our Mission
            </p>
            <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-6">
              The Platform Built for{" "}
              <span style={{ color: "#f0c040" }}>Traders</span>{" "}
              <br className="hidden sm:block" />
              Who Are Tired of Losing.
            </h2>
            <p
              className="text-base sm:text-lg leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              TopFloor was built by traders who know what it feels like to sit
              alone at a screen, second-guessing every move. Our team brings
              7+ years of live trading experience across futures, options, and
              momentum stocks. We didn&apos;t build this for traders who already
              have it figured out. We built it for everyone else.
            </p>
            <p
              className="text-base leading-relaxed mb-10"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              No fluff. No overnight-millionaire promises. Just battle-tested
              setups, live execution, and a community of real traders who hold
              each other accountable every single day.
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
