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

      {/* DESKTOP: chart scene weighted to the right, dark/empty left for the
          copy. Seamless looping background. */}
      <div className="hidden md:block">
        <HeroVideo src="/hero-loop.mp4" poster="/hero-desktop-v4.png" />
      </div>

      {/* readability scrims */}
      <div className="pointer-events-none absolute inset-0 bg-black/60" />
      {/* mobile: charts top & bottom, dim them and keep the middle clear */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/90 via-black/35 to-black/90 md:hidden" />
      {/* desktop: chart lives on the right, so darken the left for the copy */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/100 via-black/65 to-transparent md:block" />

      {/* overlay copy */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6">
        <HeroCopy />
      </div>
    </section>
  );
}
