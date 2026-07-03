"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PROOF = [
  { src: "/results/Result4.PNG", label: "$56,500 Lifetime Payouts" },
  { src: "/results/Result8.JPG", label: "Topstep Funded Trader - Clyde Macapagal" },
  { src: "/results/Result11.JPEG", label: "Topstep Funded Trader - Jesus Villanueva" },
  { src: "/results/Result2.PNG", label: "$13,000 Alpha Futures Payout" },
  { src: "/results/Result9.JPEG", label: "Lucid LucidFlex 50K Funded" },
  { src: "/results/Result13.JPEG", label: "Topstep Payout Approved" },
  { src: "/results/Result5.PNG", label: "Topstep Funded Trader - Philip Wilson" },
  { src: "/results/Result7.PNG", label: "$1,094 Lucid Trading Payout" },
  { src: "/results/Result14.PNG", label: "Topstep Payout Processed" },
  { src: "/results/Results16.png", label: "Funded Account Result" },
  { src: "/results/Result3.PNG", label: "$8,500 Lucid Trading Payout" },
  { src: "/results/Result10.JPEG", label: "Lucid LucidFlex 50K Funded" },
  { src: "/results/Result6.PNG", label: "$1,350 Alpha Futures Payout" },
  { src: "/results/Result12.JPEG", label: "Topstep Funded Trader - Jesus Villanueva" },
  { src: "/results/Result1.jpeg", label: "Daily PNL Calendar" },
  { src: "/results/Result15.PNG", label: "Funded Account Certificate" },
];

export default function FundedWins() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => go((current + 1) % PROOF.length), [current, go]);
  const prev = () => go((current - 1 + PROOF.length) % PROOF.length);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="py-20 sm:py-28" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#00ff88" }}>
            Verified Proof
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
            Members Winning.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Funded accounts, payouts, and passed evaluations from our community.
          </p>
        </div>

        {/* Slider */}
        <div className="relative">
          {/* Main frame */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              border: "1px solid rgba(0,255,136,0.12)",
              height: "clamp(380px, 58vw, 620px)",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current}
                initial={{ opacity: 0, x: direction * 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -80 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {/* Blurred bg fill */}
                <Image
                  src={PROOF[current].src}
                  alt=""
                  fill
                  style={{ objectFit: "cover", filter: "blur(28px) brightness(0.35)", transform: "scale(1.1)", zIndex: 1 }}
                  aria-hidden
                />
                {/* Sharp foreground image */}
                <Image
                  src={PROOF[current].src}
                  alt={PROOF[current].label}
                  fill
                  style={{ objectFit: "contain", zIndex: 2 }}
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Label */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0,255,136,0.25)",
                color: "#00ff88",
                whiteSpace: "nowrap",
                zIndex: 10,
              }}
            >
              {PROOF[current].label}
            </div>

            {/* Arrows */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
              style={{
                width: 44, height: 44, zIndex: 10,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", cursor: "pointer",
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
              style={{
                width: 44, height: 44, zIndex: 10,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", cursor: "pointer",
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Counter */}
          <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
            {current + 1} / {PROOF.length}
          </p>

          {/* Thumbnail strip */}
          <div className="flex gap-3 mt-4 justify-center flex-wrap">
            {PROOF.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`View ${item.label}`}
                className="relative rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  width: 96, height: 66,
                  border: i === current ? "2px solid #00ff88" : "2px solid rgba(255,255,255,0.08)",
                  opacity: i === current ? 1 : 0.4,
                  cursor: "pointer",
                  background: "#111",
                  transition: "all 0.2s ease",
                }}
              >
                <Image src={item.src} alt={item.label} fill style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-10" style={{ color: "rgba(255,255,255,0.2)" }}>
          Individual results vary. Past performance does not guarantee future results. Trading involves risk.
        </p>
      </div>
    </section>
  );
}
