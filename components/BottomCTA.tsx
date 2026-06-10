import Link from "next/link";

interface BottomCTAProps {
  headline?: string;
  sub?: string;
}

export default function BottomCTA({
  headline = "Ready to Trade at the Top?",
  sub = "Every result you've seen started with one decision. Join the community today.",
}: BottomCTAProps) {
  return (
    <section style={{ background: "#0a0a0a", padding: "72px 24px 96px" }}>
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          textAlign: "center",
          padding: "56px 40px",
          borderRadius: 24,
          border: "1px solid rgba(0,255,136,0.15)",
          background: "linear-gradient(135deg, #0f1a14 0%, #0a1510 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: 200,
            background: "radial-gradient(ellipse, rgba(0,255,136,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16, position: "relative" }}>
          Join Now
        </p>
        <h2
          className="display-font"
          style={{ color: "#f5f5f5", fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.05, margin: "0 0 16px", position: "relative" }}
        >
          {headline}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.6, marginBottom: 36, maxWidth: 440, marginLeft: "auto", marginRight: "auto", position: "relative" }}>
          {sub}
        </p>
        <Link href="/pricing" className="btn-primary" style={{ fontSize: 16, padding: "14px 40px", display: "inline-block", position: "relative" }}>
          Join the Community
        </Link>
      </div>
    </section>
  );
}
