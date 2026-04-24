"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const PROOF_IMAGES = [
  "/certs/cert-1.jpg",
  "/certs/cert-2.jpg",
  "/certs/cert-3.jpg",
  "/certs/cert-4.jpg",
  "/certs/cert-5.jpg",
  "/certs/cert-6.jpg",
];

export default function FundedWins() {
  return (
    <section className="py-20 sm:py-28" style={{ background: "#0d0d0d" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#00ff88" }}>
            Proof
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
            Members Winning.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Funded accounts, payouts, and passed evaluations — straight from our community.
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {PROOF_IMAGES.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="break-inside-avoid rounded-2xl overflow-hidden border"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <Image
                src={src}
                alt={`Member proof ${i + 1}`}
                width={600}
                height={400}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
