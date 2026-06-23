"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const CREDENTIALS = [
  { img: "/about-cards/card-1.jpg", label: "7+ Years in the Markets" },
  { img: "/about-cards/card-2.jpg", label: "Live Sessions Every Day" },
  { img: "/about-cards/card-3.jpg", label: "87% Member Win Rate" },
  { img: "/about-cards/card-4.jpg", label: "$4.2M+ Community Profits" },
];

export default function About() {
  return (
    <section
      id="about"
      className="py-20 sm:py-28"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse items-stretch gap-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Credential cards (sticky on desktop so they follow on scroll) */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
          >
            {CREDENTIALS.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-4 rounded-2xl border p-5 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(0,255,136,0.18)",
                }}
              >
                <div
                  className="relative shrink-0 overflow-hidden rounded-xl"
                  style={{ width: 64, height: 64 }}
                >
                  <Image
                    src={c.img}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "#f5f5f5" }}
                >
                  {c.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Bio content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
              alone at a screen, second-guessing every move. Our team brings 7+
              years of live trading experience across futures, options, and
              momentum stocks. We didn&apos;t build this for traders who already
              have it figured out. We built it for everyone else.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              No fluff. No overnight-millionaire promises. Just battle-tested
              setups, live execution, and a community of real traders who hold
              each other accountable every single day.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
