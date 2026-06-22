import Image from "next/image";
import HeroIntro from "@/components/HeroIntro";
import RealismButton from "@/components/ui/shiny-borders-button";

const AVATARS = [
  "/avatars/avatar-1.jpg",
  "/avatars/avatar-2.jpg",
  "/avatars/avatar-3.jpg",
  "/avatars/avatar-4.jpg",
  "/avatars/avatar-5.jpg",
];

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
        <div className="max-w-xl">
          {/* live badge */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
            style={{
              background: "rgba(0,255,136,0.08)",
              borderColor: "rgba(0,255,136,0.25)",
              color: "#00ff88",
            }}
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full"
              style={{ background: "#00ff88" }}
            />
            <span className="text-sm font-semibold tracking-wide">
              Live Sessions Running Daily
            </span>
          </div>

          <h1 className="display-font text-6xl leading-[0.95] text-white sm:text-7xl">
            Trade smarter.
            <br />
            Win bigger.
            <br />
            Live at the{" "}
            <span className="glow-green" style={{ color: "#00ff88" }}>
              Floor.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-6 text-zinc-300 md:text-base md:leading-7">
            Join 1,200+ traders who are finally trading with a real edge. Live
            sessions, real alerts, and a community that actually shows up.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <RealismButton
              text="Join the Community"
              href="/pricing"
              variant="green"
            />
            <RealismButton
              text="Watch Free Training"
              href="https://discord.gg/yebuyWPswJ"
              variant="gold"
            />
          </div>

          {/* social proof */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2"
                  style={{ borderColor: "#0a0a0a" }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-sm text-zinc-400">
              <span className="font-semibold" style={{ color: "#00ff88" }}>
                1,200+
              </span>{" "}
              members trading live
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
