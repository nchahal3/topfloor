import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CancelPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-lg w-full text-center">
        <p style={{ fontSize: 48, marginBottom: 24 }}>👋</p>

        <h1
          className="display-font text-5xl sm:text-6xl text-white mb-4"
          style={{ lineHeight: 1.1 }}
        >
          No worries.
        </h1>

        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          You didn&apos;t complete your checkout - that&apos;s totally fine.
          Whenever you&apos;re ready to trade from the top, we&apos;ll be here.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <Link
            href="/pricing"
            style={{
              display: "inline-block",
              background: "#00ff88",
              color: "#000",
              fontWeight: 700,
              padding: "14px 36px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            View Plans →
          </Link>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
