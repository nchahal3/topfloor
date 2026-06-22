import Image from "next/image";
import HeroIntro from "@/components/HeroIntro";
import HeroCopy from "@/components/HeroCopy";

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-black text-white">
      {/* MOBILE: portrait staircase (leans right) — video intro + matching frame */}
      <div className="md:hidden">
        <HeroIntro src="/hero-intro-mobile.mp4" poster="/hero-mobile.png" />
        <Image
          src="/hero-mobile.png"
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
      <div className="pointer-events-none absolute inset-0 bg-black/25 md:hidden" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black from-0% via-black/85 via-45% to-black/30 to-100% md:hidden" />
      {/* desktop: unchanged */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black from-0% via-black/75 via-25% to-transparent to-50% md:block" />

      {/* overlay copy */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6">
        <HeroCopy />
      </div>
    </section>
  );
}
