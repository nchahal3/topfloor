import { ExternalLink } from "lucide-react";
import Image from "next/image";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import BottomCTA from "@/components/BottomCTA";

const FIRMS = [
  {
    name: "Alpha Futures",
    logo: "AF",
    logoImg: "/firms/alpha.png",
    color: "#00ff88",
    description: "Top-rated futures prop firm. Fast payouts, fair rules, great for scalpers and momentum traders.",
    code: "TOPFLOOR",
    discount: "10% off evaluation",
    url: "https://app.alpha-futures.com",
  },
  {
    name: "Lucid Trading",
    logo: "LT",
    logoImg: "/firms/lucid.png",
    color: "#f0c040",
    description: "Lucid's evaluation accounts are built for disciplined day traders. No drawdown tricks.",
    code: "FLOOR10",
    discount: "10% off any plan",
    url: "#",
  },
  {
    name: "Apex Trader Funding",
    logo: "ATF",
    logoImg: "/firms/apex.png",
    color: "#c0c0c0",
    description: "One of the most popular prop firms. Large account sizes up to $300K.",
    code: "TOPFLOOR",
    discount: "Free trial available",
    url: "#",
  },
];

export default function FundedAccountsPage() {
  return (
    <PageLayout withTopPadding={false}>
      <PageHeader label="Our Picks" title="Get Funded" subtitle="The TopFloor team's personally vetted prop firms. Pass your eval and start trading with real capital." image="/getfunded-banner.jpg" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FIRMS.map((firm) => (
              <div
                key={firm.name}
                style={{
                  padding: "28px",
                  borderRadius: 18,
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 22,
                  flexWrap: "wrap",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
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
                    overflow: "hidden",
                  }}
                >
                  {firm.logoImg ? (
                    <Image
                      src={firm.logoImg}
                      alt={firm.name}
                      width={44}
                      height={44}
                      style={{ objectFit: "contain", borderRadius: 8 }}
                    />
                  ) : (
                    firm.logo
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: "0 0 6px" }}>{firm.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 18px", lineHeight: 1.6 }}>
                    {firm.description}
                  </p>
                </div>

                <a
                  href={firm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "11px 22px",
                    borderRadius: 12,
                    background: "rgba(0,255,136,0.08)",
                    border: "1px solid rgba(0,255,136,0.2)",
                    color: "#00ff88",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    alignSelf: "center",
                  }}
                >
                  Visit Site <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 40,
              padding: "18px 22px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0, lineHeight: 1.8 }}>
              <strong style={{ color: "rgba(255,255,255,0.45)" }}>Disclaimer:</strong> These are affiliate partnerships. The TopFloor team uses and endorses these firms personally. Passing an evaluation does not guarantee future profits. Trading involves significant risk. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      <BottomCTA
        headline="Get Funded. Trade With Real Capital."
        sub="Join the community, learn the system, and use our partner firms to get a funded account."
      />
    </PageLayout>
  );
}
