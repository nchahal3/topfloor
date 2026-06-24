import Image from "next/image";
import HeroIntro from "@/components/HeroIntro";
import HeroCopy from "@/components/HeroCopy";

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-black text-white">
      {/* MOBILE: portrait green-glass trading scene — elements top & bottom,
          dark clear middle for the copy. Video intro + matching frame */}
      <div className="md:hidden">
        <HeroIntro
          src="/hero-intro-mobile-v2.mp4"
          poster="/hero-mobile-v2.png"
        />
        <Image
          src="/hero-mobile-v2.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* DESKTOP: landscape staircase — unchanged */}
      <div className="hidden md:block">
        <HeroIntro src="/hero-intro.mp4" poster="/hero-end.png" />
        <Image
          src="/hero-end.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* readability gradient on the left, behind the copy */}
      {/* mobile: stronger left-to-right black gradient + slight overall scrim
          so the copy stays readable over the bright staircase (staircase leans right) */}
      <div className="pointer-events-none absolute inset-0 bg-black/30 md:hidden" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/55 md:hidden" />
      {/* desktop: unchanged */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black from-0% via-black/75 via-25% to-transparent to-50% md:block" />

      {/* overlay copy */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6">
        <HeroCopy />
      </div>
    </section>
  );
}
