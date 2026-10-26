"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <Link
        href="/"
        className="display-font text-3xl glow-green-subtle"
        style={{ color: "#00ff88", textDecoration: "none", marginBottom: 40 }}
      >
        🔝Floor
      </Link>

      <p
        className="display-font"
        style={{ fontSize: 80, color: "rgba(255,255,255,0.06)", lineHeight: 1, margin: "0 0 8px" }}
      >
        Oops
      </p>

      <h1
        className="display-font"
        style={{ color: "#f5f5f5", fontSize: 36, margin: "0 0 12px", lineHeight: 1.1 }}
      >
        Something went wrong
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, maxWidth: 400, margin: "0 0 36px", lineHeight: 1.6 }}>
        An unexpected error occurred. Try refreshing, or head back to the homepage.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} className="btn-primary px-8 py-3 text-sm">
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: "12px 32px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
