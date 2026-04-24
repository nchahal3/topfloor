"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Teeghan W.",
    role: "Futures Trader",
    quote:
      "Passed my Alpha Futures evaluation after joining 🔝Floor. Coach Floor taught me how to manage risk properly and stick to a system. Could not have done it without this community.",
    profit: "Passed Alpha Futures",
    initials: "TW",
    color: "#1a4f3a",
  },
  {
    name: "Noah",
    role: "Funded Trader",
    quote:
      "Got my Lucid Trading 50K funded account after applying the 🔝Floor system. The live sessions and coaching calls made all the difference. Worth every penny.",
    profit: "Lucid 50K Funded",
    initials: "N",
    color: "#1a2f5a",
  },
  {
    name: "Godbless",
    role: "Futures Trader",
    quote:
      "Became a Topstep Express Funded Trader with a 50K account. Coach Floor gave me the structure and discipline I was missing. The trade alerts kept me focused every morning.",
    profit: "Topstep 50K Funded",
    initials: "GB",
    color: "#3a1a4f",
  },
  {
    name: "Nav",
    role: "Day Trader",
    quote:
      "Passed my Lucid Trading evaluation and got funded. The 🔝Floor model is the real deal. If you put in the work and follow the system, results will come.",
    profit: "Lucid 50K Funded",
    initials: "TF",
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
