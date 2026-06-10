"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const RESULTS = [
  "/certs/cert-1.jpg",
  "/certs/cert-2.jpg",
  "/certs/cert-3.jpg",
  "/certs/cert-4.jpg",
  "/certs/cert-5.jpg",
  "/certs/cert-6.jpg",
];

export default function FeatureTeasers() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % RESULTS.length);
  }, []);

  const prev = () => {
    setCurrent((i) => (i - 1 + RESULTS.length) % RESULTS.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section style={{ background: "#0d0d0d", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Real Proof
          </p>
          <h2 className="display-font" style={{ color: "#f5f5f5", fontSize: "clamp(36px, 6vw, 60px)", margin: 0, lineHeight: 1 }}>
            Results That Speak For Themselves
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginTop: 16, maxWidth: 480, margin: "16px auto 0" }}>
            Verified payouts and funded account passes from our community.
          </p>
        </div>

        {/* Slider */}
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          {/* Track */}
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,255,136,0.15)" }}>
            <div
              style={{
                display: "flex",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                transform: `translateX(-${current * 100}%)`,
              }}
            >
              {RESULTS.map((src, i) => (
                <div
                  key={i}
                  style={{ minWidth: "100%", height: 460, position: "relative", background: "#111", flexShrink: 0 }}
                >
                  <Image
                    src={src}
                    alt={`Member result ${i + 1}`}
                    fill
                    style={{ objectFit: "contain" }}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prev arrow */}
          <button
            type="button"
            onClick={prev}
            style={{
              position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", zIndex: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
            aria-label="Previous result"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Next arrow */}
          <button
            type="button"
            onClick={next}
            style={{
              position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", zIndex: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
            aria-label="Next result"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          {RESULTS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to result ${i + 1}`}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? "#00ff88" : "rgba(255,255,255,0.18)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Counter */}
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
          {current + 1} / {RESULTS.length}
        </p>

      </div>
    </section>
  );
}
