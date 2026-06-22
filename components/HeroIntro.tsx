"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroIntro({
  src = "/hero-intro.mp4",
  poster = "/hero-end.png",
}: {
  src?: string;
  poster?: string;
}) {
  const [done, setDone] = useState(false);
  // If autoplay is blocked (iOS Low Power / Low Data Mode, etc.) we drop the
  // <video> entirely so no play button is ever shown — the static hero behind
  // it (hero-end.png) becomes the background instantly.
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.setAttribute("muted", "");
      const attempt = v.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          // autoplay refused by the device — reveal the static hero now and
          // remove the video so there's no lingering play button
          setAutoplayBlocked(true);
          setDone(true);
        });
      }
    }

    // Fallback: if onEnded never fires for some reason, reveal after ~9s.
    timer.current = setTimeout(() => setDone(true), 9800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const skip = () => {
    if (videoRef.current) videoRef.current.pause();
    setDone(true);
  };

  // Nothing to overlay once we've fallen back to the static hero.
  if (autoplayBlocked) return null;

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
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={poster}
        onEnded={() => setDone(true)}
      />

      {!done && (
        <button
          type="button"
          onClick={skip}
          className="absolute bottom-6 right-6 z-40 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
        >
          Skip <span aria-hidden>&rsaquo;&rsaquo;</span>
        </button>
      )}
    </div>
  );
}
