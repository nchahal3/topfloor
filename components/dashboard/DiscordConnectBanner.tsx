"use client";

import { useSearchParams } from "next/navigation";

export default function DiscordConnectBanner({ discordUserId }: { discordUserId: string | null }) {
  const searchParams = useSearchParams();
  const status = searchParams.get("discord");

  if (discordUserId && status !== "error") {
    return null;
  }

  if (status === "connected") {
    return null;
  }

  return (
    <div
      style={{
        padding: "14px 20px",
        borderRadius: 12,
        background: status === "error" ? "rgba(255,68,68,0.06)" : "rgba(88,101,242,0.08)",
        border: `1px solid ${status === "error" ? "rgba(255,68,68,0.25)" : "rgba(88,101,242,0.3)"}`,
        marginBottom: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <p style={{ color: "#f5f5f5", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>
          {status === "error" ? "Discord connection failed" : "Connect your Discord account"}
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>
          {status === "error"
            ? "Something went wrong. Try again to get automatic access to the Pro channels."
            : "Link Discord to get automatic access to the Floor Pro channels when you join."}
        </p>
      </div>
      <a
        href="/api/discord/connect"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 20px",
          borderRadius: 10,
          background: "#5865F2",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="16" height="12" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M60.1 4.9A58.6 58.6 0 0 0 45.6.7a40.7 40.7 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A40.6 40.6 0 0 0 25.7.7 58.5 58.5 0 0 0 11.1 5C1.6 19.4-1 33.4.3 47.2a59 59 0 0 0 18 9.1 43.5 43.5 0 0 0 3.8-6.1 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 35.9 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.1 58.8 58.8 0 0 0 18-9.1c1.5-15.6-2.6-29.5-10.7-42.3ZM23.7 38.7c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z" fill="currentColor"/>
        </svg>
        {status === "error" ? "Try Again" : "Connect Discord"}
      </a>
    </div>
  );
}
