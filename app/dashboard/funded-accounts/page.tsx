import { ExternalLink } from "lucide-react";

const FIRMS = [
  {
    name: "Alpha Futures",
    logo: "AF",
    color: "#00ff88",
    description: "Top-rated futures prop firm. Fast payouts, fair rules, great for scalpers.",
    code: "TOPFLOOR",
    discount: "10% off evaluation",
    url: "https://app.alpha-futures.com",
  },
  {
    name: "Lucid Trading",
    logo: "LT",
    color: "#f0c040",
    description: "Lucid's evaluation accounts are built for disciplined day traders. No drawdown tricks.",
    code: "FLOOR10",
    discount: "10% off any plan",
    url: "https://lucidtrading.com/",
  },
  {
    name: "Apex Trader Funding",
    logo: "ATF",
    color: "#c0c0c0",
    description: "One of the most popular prop firms. Large account sizes up to $300K.",
    code: "TOPFLOOR",
    discount: "Free trial available",
    url: "https://apextraderfunding.com/",
  },
];

export default function FundedAccountsPage() {
  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Free for All Members
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Funded Accounts
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          Coach Floor's personally vetted prop firms. Pass your eval and start trading with real capital.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {FIRMS.map((firm) => (
          <div
            key={firm.name}
            style={{
              padding: "24px",
              borderRadius: 16,
              background: "#111",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: `${firm.color}18`,
                border: `1px solid ${firm.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontWeight: 800,
                fontSize: 12,
                color: firm.color,
                letterSpacing: "0.05em",
              }}
            >
              {firm.logo}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 17, margin: "0 0 6px" }}>{firm.name}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
                {firm.description}
              </p>
            </div>

            {/* CTA */}
            <a
              href={firm.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 10,
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.2)",
                color: "#00ff88",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Visit Site <ExternalLink size={13} />
            </a>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: "16px 20px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: "rgba(255,255,255,0.5)" }}>Disclaimer:</strong> These are affiliate partnerships. Coach Floor uses and endorses these firms personally. Passing an evaluation does not guarantee future profits. Trading involves risk.
        </p>
      </div>
    </div>
  );
}
