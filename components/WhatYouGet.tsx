"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "🎥",
    title: "Live Trading Sessions",
    description:
      "Watch Coach Floor trade live every morning before market open. Real setups, real entries, real exits. You see exactly what he sees and why he pulls the trigger.",
  },
  {
    icon: "💬",
    title: "Private Discord Community",
    description:
      "24/7 access to 1,200+ active traders. Trade ideas, daily recaps, member spotlights, and a community that genuinely wants you to win.",
  },
  {
    icon: "⚡",
    title: "Instant Trade Alerts",
    description:
      "The second a setup is live, you get the alert. Straight to Discord and your phone. By the time most people notice the move, you already knew.",
  },
  {
    icon: "🎯",
    title: "1-on-1 Mentorship",
    description:
      "Book private sessions directly with Coach Floor. Get your charts reviewed, your strategy dialed in, and your mindset right.",
  },
];

export default function WhatYouGet() {
  return (
    <section
      id="what-you-get"
      className="py-20 sm:py-28"
      style={{ background: "#0d0d0d" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#00ff88" }}
          >
            Membership Includes
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none">
            Everything You Need to{" "}
            <span style={{ color: "#00ff88" }}>Trade Like a Pro</span>
          </h2>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="card-hover rounded-2xl p-6 border flex flex-col"
              style={{
                background: "#111",
                borderColor: "rgba(255,255,255,0.06)",
                borderTop: "2px solid #00ff88",
              }}
            >
              <div className="text-4xl mb-5">{feature.icon}</div>
              <h3 className="text-lg font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
