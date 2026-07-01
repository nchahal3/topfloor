"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import RealismButton from "@/components/ui/shiny-borders-button";

export default function HeroCopy() {
  const reduce = useReducedMotion();

  // Staggered entrance: badge -> headline -> subtext -> buttons -> social proof.
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.35 },
    },
  };
  const item: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
      };

  return (
    <motion.div
      className="mx-auto max-w-xl text-center md:mx-0 md:text-left"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* live badge */}
      <motion.div
        variants={item}
        className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
        style={{
          background: "rgba(0,255,136,0.08)",
          borderColor: "rgba(0,255,136,0.25)",
          color: "#00ff88",
        }}
      >
        <span
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ background: "#00ff88" }}
        />
        <span className="text-sm font-semibold tracking-wide">
          Live Sessions Running Daily
        </span>
      </motion.div>

      <motion.h1
        variants={item}
        className="display-font text-6xl leading-[0.95] text-white sm:text-7xl"
      >
        Trade smarter.
        <br />
        Win bigger.
        <br />
        Live at the{" "}
        <span className="glow-green" style={{ color: "#00ff88" }}>
          Floor.
        </span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-md text-sm leading-6 text-zinc-300 md:mx-0 md:text-base md:leading-7"
      >
        Join 1,200+ traders who are finally trading with a real edge. Live
        sessions, real alerts, and a community that actually shows up.
      </motion.p>

      <motion.div
        variants={item}
        className="mt-8 flex flex-wrap items-center justify-center gap-5 md:justify-start"
      >
        <RealismButton
          text="Join the Community"
          href="/pricing"
          variant="green"
        />
        <RealismButton
          text="Watch Free Training"
          href="https://discord.gg/yebuyWPswJ"
          variant="gold"
        />
      </motion.div>
    </motion.div>
  );
}
