import Image from "next/image";
import HeroIntro from "@/components/HeroIntro";
import RealismButton from "@/components/ui/shiny-borders-button";

const AVATAR_COLORS = ["#1a4f3a", "#1a2f5a", "#3a1a4f", "#4f3a1a", "#2a3f1a"];

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-black text-white">
      {/* intro animation that plays then fades to reveal the hero */}
      <HeroIntro />

      {/* neon staircase background (video's final frame, seamless fade) */}
      <Image
        src="/hero-end.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* readability gradient on the left, behind the copy */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black from-0% via-black/75 via-25% to-transparent to-50%" />

      {/* overlay copy */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6">
        <div className="max-w-xl font-display">
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

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Trade smarter.
            <br />
            Win bigger.
            <br />
            Live at the{" "}
            <span className="glow-green" style={{ color: "#00ff88" }}>
              Floor.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-zinc-300">
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
              {AVATAR_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2"
                  style={{ background: color, borderColor: "#0a0a0a" }}
                />
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
