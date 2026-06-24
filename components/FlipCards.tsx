"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

type Item = { img: string; label: string };

export default function FlipCards({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  // Scroll through this tall wrapper drives which card is shown.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.floor(v * items.length)));
    if (i !== index) setIndex(i);
  });

  const item = items[index];

  return (
    <div ref={ref} style={{ height: `${items.length * 42}vh` }}>
      <div className="sticky top-[14vh]" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotateX: 70 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, rotateX: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotateX: -70 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[68vh] max-h-[600px] w-full overflow-hidden rounded-3xl border shadow-2xl shadow-black/50"
            style={{
              borderColor: "rgba(0,255,136,0.25)",
              transformOrigin: "center",
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src={item.img}
              alt=""
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
              priority
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.2) 55%, transparent)",
              }}
            />
            {/* progress dots */}
            <div className="absolute right-5 top-5 flex gap-1.5">
              {items.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background:
                      i === index ? "#00ff88" : "rgba(255,255,255,0.3)",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="display-font text-3xl leading-none text-white sm:text-4xl">
                {item.label}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
