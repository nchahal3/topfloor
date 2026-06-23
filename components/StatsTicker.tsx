import {
  Trophy,
  Users,
  Banknote,
  TrendingUp,
  Zap,
  Target,
  Flame,
  type LucideIcon,
} from "lucide-react";

const STATS: { icon: LucideIcon; text: string }[] = [
  { icon: Trophy, text: "87% Win Rate" },
  { icon: Users, text: "1,200+ Students Coached" },
  { icon: Banknote, text: "$4.2M+ Community Profits" },
  { icon: TrendingUp, text: "7 Years Trading Experience" },
  { icon: Zap, text: "Live Trade Alerts Daily" },
  { icon: Target, text: "Futures, Options & Stocks" },
  { icon: Flame, text: "Top 1% Trading Strategies" },
];

function TickerItem({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="flex items-center whitespace-nowrap">
      <span className="flex items-center gap-3 px-10">
        <Icon size={22} strokeWidth={2.25} style={{ color: "#00ff88" }} />
        <span
          className="text-[17px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          {text}
        </span>
      </span>
      {/* separator dot */}
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: "rgba(0,255,136,0.45)",
          flexShrink: 0,
        }}
      />
    </span>
  );
}

export default function StatsTicker() {
  const doubled = [...STATS, ...STATS];

  return (
    <div
      className="ticker-wrapper w-full overflow-hidden border-y py-6"
      style={{
        background:
          "linear-gradient(180deg, #0c0c0c 0%, #0e0e0e 50%, #0c0c0c 100%)",
        borderColor: "rgba(0,255,136,0.12)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
      }}
    >
      <div className="animate-marquee">
        {doubled.map((stat, i) => (
          <TickerItem key={i} icon={stat.icon} text={stat.text} />
        ))}
      </div>
    </div>
  );
}
