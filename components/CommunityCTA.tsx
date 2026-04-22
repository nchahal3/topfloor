"use client";

import { motion } from "framer-motion";

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function CommunityCTA() {
  return (
    <section
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "#0d0d0d" }}
    >
      {/* Green gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,136,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />

      {/* Top/bottom border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,255,136,0.4), transparent)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,255,136,0.4), transparent)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-6"
            style={{ color: "#00ff88" }}
          >
            Join the Community
          </p>
          <h2 className="display-font leading-none text-white mb-6"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            Ready to Trade from the{" "}
            <span className="glow-green" style={{ color: "#00ff88" }}>
              🔝Floor?
            </span>
          </h2>
          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Join 1,200+ traders getting daily alerts, live sessions, and a
            community that wins together. First month risk-free.
          </p>

          <a
            href="https://discord.gg/kxnfaPNC"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block px-10 py-5 text-xl glow-box-green"
          >
            Join the Community Now →
          </a>

          <p
            className="text-sm mt-6"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Cancel anytime · No long-term contracts · Instant access
          </p>
        </motion.div>
      </div>
    </section>
  );
}
