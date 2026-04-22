const STATS = [
  { icon: "🏆", text: "87% Win Rate" },
  { icon: "👥", text: "1,200+ Students Coached" },
  { icon: "💰", text: "$4.2M+ Community Profits" },
  { icon: "📈", text: "7 Years Trading Experience" },
  { icon: "⚡", text: "Live Trade Alerts Daily" },
  { icon: "🎯", text: "Futures, Options & Stocks" },
  { icon: "🔥", text: "Top 1% Trading Strategies" },
];

function TickerItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="flex items-center gap-3 whitespace-nowrap px-8">
      <span className="text-lg">{icon}</span>
      <span
        className="text-sm font-bold tracking-widest uppercase"
        style={{ color: "#00ff88", fontFamily: "var(--font-dm-sans, monospace)" }}
      >
        {text}
      </span>
      <span className="text-2xl font-thin" style={{ color: "rgba(0,255,136,0.25)" }}>
        |
      </span>
    </span>
  );
}

export default function StatsTicker() {
  const doubled = [...STATS, ...STATS];

  return (
    <div
      className="w-full overflow-hidden ticker-wrapper py-4 border-y"
      style={{
        background: "#0d0d0d",
        borderColor: "rgba(0,255,136,0.1)",
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
