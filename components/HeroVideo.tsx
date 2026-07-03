"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Seamless looping hero background. The static poster image always renders
// behind it, so if the device blocks autoplay or the user prefers reduced
// motion we simply show the still frame the loop was generated from - no gap,
// no play button, no visible start/end.
export default function HeroVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowVideo(false);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => setShowVideo(false));
    }
  }, []);

  return (
    <>
      {/* Static fallback - also serves as the video poster so the first frame
          matches exactly while the loop buffers. */}
      <Image
        src={poster}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
        />
      )}
    </>
  );
}
