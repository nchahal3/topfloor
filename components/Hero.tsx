import HeroVideo from "@/components/HeroVideo";
import HeroCopy from "@/components/HeroCopy";

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-black text-white">
      {/* MOBILE: portrait green-glass trading scene — motion top & bottom,
          dark clear middle for the copy. Seamless looping background. */}
      <div className="md:hidden">
        <HeroVideo src="/hero-loop-mobile.mp4" poster="/hero-mobile-v2.png" />
      </div>

      {/* DESKTOP: wide version of the mobile chart scene — motion top & bottom,
          dark clear middle for the copy. Seamless looping background. */}
      <div className="hidden md:block">
        <HeroVideo src="/hero-loop.mp4" poster="/hero-desktop-v2.png" />
      </div>

      {/* readability scrims — charts live top & bottom, copy sits in the clear
          middle. Same treatment on mobile and desktop now. */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      {/* dim the top & bottom charts, keep the middle clear */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/5 to-black/60" />
      {/* desktop copy is left-aligned, so add a soft left scrim */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/70 via-black/15 to-transparent md:block" />

      {/* overlay copy */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6">
        <HeroCopy />
      </div>
    </section>
  );
}
