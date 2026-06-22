"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroIntro() {
  const [done, setDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      // Mobile (esp. iOS Safari) only autoplays when muted is guaranteed and
      // the play() call is made programmatically. React doesn't reliably emit
      // the `muted` attribute into the HTML, so set it explicitly here.
      v.muted = true;
      v.setAttribute("muted", "");
      const attempt = v.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          // autoplay still blocked (e.g. iOS Low Power Mode) — fallback timer
          // below reveals the hero; the poster keeps it from showing a play button
        });
      }
    }

    // Fallback: if autoplay is blocked or onEnded never fires, reveal the hero
    // anyway shortly after the clip's ~9s runtime.
    timer.current = setTimeout(() => setDone(true), 9800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      aria-hidden={done}
      className={`absolute inset-0 z-30 bg-black transition-opacity duration-700 ease-out ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/hero-intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/hero-end.png"
        onEnded={() => setDone(true)}
      />
    </div>
  );
}
