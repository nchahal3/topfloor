"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

const FEATURES = [
  {
    icon: "🎥",
    title: "Live Trading Sessions",
    description:
      "Watch the TopFloor team trade live every morning before market open. Real setups, real entries, real exits. You see exactly what they see and why they pull the trigger.",
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
      "Book private sessions directly with the TopFloor team. Get your charts reviewed, your strategy dialed in, and your mindset right.",
  },
];

function FeatureCard({ feature, style }: { feature: typeof FEATURES[0]; style?: React.CSSProperties }) {
  return (
    <div
      className="card-hover rounded-2xl p-6 border flex flex-col h-full"
      style={{
        background: "#111",
        borderColor: "rgba(255,255,255,0.06)",
        borderTop: "2px solid #00ff88",
        ...style,
      }}
    >
      <div className="text-4xl mb-5">{feature.icon}</div>
      <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
      <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
        {feature.description}
      </p>
    </div>
  );
}

export default function WhatYouGet() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
    }
    setActiveIndex(index);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft - el.scrollLeft - 16);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIndex(closest);
  };

  return (
    <section id="what-you-get" className="py-20 sm:py-28" style={{ background: "#0d0d0d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#00ff88" }}>
            Membership Includes
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none">
            Everything You Need to{" "}
            <span style={{ color: "#00ff88" }}>Trade Like a Pro</span>
          </h2>
        </motion.div>

        {/* Desktop: 4-column grid */}
        <div className="hidden lg:grid grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>

        {/* Mobile: sliding carousel */}
        <div className="lg:hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              padding: "4px 16px 4px",
              margin: "0 -16px",
            }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                style={{
                  scrollSnapAlign: "start",
                  minWidth: "calc(85vw)",
                  flexShrink: 0,
                }}
              >
                <FeatureCard feature={feature} style={{ height: "100%" }} />
              </div>
            ))}
            {/* Trailing spacer so last card can snap to start */}
            <div style={{ minWidth: 16, flexShrink: 0 }} />
          </div>

          {/* Dot indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 20,
            }}
          >
            {FEATURES.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: i === activeIndex ? "#00ff88" : "rgba(255,255,255,0.18)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
