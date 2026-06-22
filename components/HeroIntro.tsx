"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroIntro() {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fallback: if autoplay is blocked or onEnded never fires, reveal the hero
  // anyway shortly after the clip's ~9s runtime.
  useEffect(() => {
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
        className="h-full w-full object-cover"
        src="/hero-intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setDone(true)}
      />
    </div>
  );
}
