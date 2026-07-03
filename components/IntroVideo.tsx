"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activated, setActivated] = useState(false);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.loop = false;
    v.controls = true;
    v.currentTime = 0;
    void v.play();
    setActivated(true);
  };

  return (
    <div className="lg:sticky lg:top-32 lg:self-start">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border shadow-2xl shadow-black/50"
        style={{ borderColor: "rgba(0,255,136,0.25)" }}
      >
        <video
          ref={videoRef}
          src="/about-cards/intro.mp4"
          poster="/about-cards/intro-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Play-with-sound overlay — hidden once the user starts it with audio */}
        {!activated && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Play video with sound"
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.35))",
            }}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
              style={{
                background: "rgba(0,255,136,0.92)",
                boxShadow: "0 8px 30px rgba(0,255,136,0.35)",
              }}
            >
              <Play size={26} fill="#0a0a0a" color="#0a0a0a" className="ml-0.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              Play with sound
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
