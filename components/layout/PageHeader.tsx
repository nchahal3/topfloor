"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface PageHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  /** Optional background image (home-page neon style). Adds a dark scrim + parallax. */
  image?: string;
}

export default function PageHeader({
  label,
  title,
  subtitle,
  image,
}: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Track scroll while the header passes the top of the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Background drifts slower than the page -> parallax. (oversized below so no gap)
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-60, 60]);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: image ? "120px 24px 96px" : "72px 24px 56px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {image && (
        <>
          {/* parallax background — taller than the header so the drift never gaps */}
          <motion.div
            style={{
              position: "absolute",
              top: -90,
              bottom: -90,
              left: 0,
              right: 0,
              y,
            }}
          >
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </motion.div>
          {/* scrim so the centered text stays readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.55), rgba(10,10,10,0.5))",
            }}
          />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            color: "#00ff88",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 16px",
          }}
        >
          {label}
        </p>
        <h1
          className="display-font"
          style={{
            color: "#f5f5f5",
            fontSize: "clamp(42px, 7vw, 72px)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 16,
              maxWidth: 560,
              margin: "16px auto 0",
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
