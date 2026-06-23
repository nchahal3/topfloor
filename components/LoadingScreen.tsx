"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const MIN_MS = 1000; // keep the splash up at least this long

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const start = Date.now();
    const finish = () => {
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(() => setShow(false), wait);
    };
    if (document.readyState === "complete") {
      finish();
      return;
    }
    window.addEventListener("load", finish, { once: true });
    const safety = window.setTimeout(finish, 4000); // never hang
    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "#0a0a0a" }}
        >
          {/* soft green glow behind the logo */}
          <div
            className="pointer-events-none absolute"
            style={{
              width: 360,
              height: 360,
              borderRadius: "9999px",
              background:
                "radial-gradient(circle, rgba(0,255,136,0.10) 0%, transparent 70%)",
            }}
          />

          <motion.div
            className="relative"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/Logo.png"
              alt="TopFloor Trades"
              width={180}
              height={75}
              priority
              style={{ objectFit: "contain", width: 180, height: "auto" }}
            />
          </motion.div>

          {/* loader bar */}
          <div
            className="relative mt-7 overflow-hidden"
            style={{
              width: 170,
              height: 3,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={reduce ? { x: "0%" } : { x: ["-100%", "100%"] }}
              transition={
                reduce
                  ? { duration: 0.3 }
                  : { duration: 1.1, ease: "easeInOut", repeat: Infinity }
              }
              style={{
                height: "100%",
                width: "60%",
                borderRadius: 9999,
                background:
                  "linear-gradient(90deg, transparent, #00ff88, transparent)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
