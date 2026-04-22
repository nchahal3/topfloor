"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Futures Trader",
    quote:
      "Made back my membership cost in the first week. Watching Coach Floor trade live completely changed how I look at setups. Nothing else comes close.",
    profit: "+$2,100 Week 1",
    initials: "MT",
    color: "#1a4f3a",
  },
  {
    name: "Priya K.",
    role: "Momentum Stocks",
    quote:
      "Coach Floor breaks it down in a way that actually makes sense. Up $3,400 in my first month. The Discord community keeps me sharp every single day.",
    profit: "+$3,400 Month 1",
    initials: "PK",
    color: "#1a2f5a",
  },
  {
    name: "Jordan W.",
    role: "Options Trader",
    quote:
      "The Discord alone is worth it. The community is incredibly supportive and the trade alerts are always on point. Best decision I&apos;ve made this year.",
    profit: "+$5,800 in 6 Weeks",
    initials: "JW",
    color: "#3a1a4f",
  },
  {
    name: "Dani R.",
    role: "Day Trader",
    quote:
      "I was skeptical, I&apos;d been burned by other courses before. But a month in and I can&apos;t imagine trading without this. Coach Floor is the real deal.",
    profit: "+$1,900 Month 1",
    initials: "DR",
    color: "#4f3a1a",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ color: "#f0c040", fontSize: "14px" }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section
      id="results"
      className="py-20 sm:py-28"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
            Member Results
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
            Real Traders. Real Results.
          </h2>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Straight from the members. No edits, no cherry picking.
          </p>
        </motion.div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="rounded-2xl p-7 border card-hover flex flex-col gap-4"
              style={{
                background: "#111",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <StarRating />

              {/* Quote mark */}
              <p
                className="display-font text-6xl leading-none -mt-2 -mb-2"
                style={{ color: "rgba(0,255,136,0.25)" }}
              >
                &ldquo;
              </p>

              <p
                className="text-base leading-relaxed"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                {t.quote}
              </p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
                <div
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(0,255,136,0.1)",
                    color: "#00ff88",
                    border: "1px solid rgba(0,255,136,0.2)",
                  }}
                >
                  {t.profit}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <p
          className="text-center text-xs mt-10"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Individual results vary. Past performance does not guarantee future results. Trading involves risk.
        </p>
      </div>
    </section>
  );
}
