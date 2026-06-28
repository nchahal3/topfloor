"use client";

import { useState } from "react";

const DISCORD_ICON = (
  <svg width="16" height="12" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M60.1 4.9A58.6 58.6 0 0 0 45.6.7a40.7 40.7 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A40.6 40.6 0 0 0 25.7.7 58.5 58.5 0 0 0 11.1 5C1.6 19.4-1 33.4.3 47.2a59 59 0 0 0 18 9.1 43.5 43.5 0 0 0 3.8-6.1 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 35.9 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.1 58.8 58.8 0 0 0 18-9.1c1.5-15.6-2.6-29.5-10.7-42.3ZM23.7 38.7c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z" fill="currentColor"/>
  </svg>
);

export default function DiscordStatus({
  discordUserId,
  discordUsername,
}: {
  discordUserId: string | null;
  discordUsername: string | null;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect your Discord account? You'll lose access to Pro channels until you reconnect.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/discord/disconnect", { method: "POST" });
      setDisconnected(true);
    } catch {
      // silent — page reload will reflect truth
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = !disconnected && !!discordUserId;

  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 16,
        background: "#111",
        border: `1px solid ${isConnected ? "rgba(88,101,242,0.25)" : "rgba(255,255,255,0.08)"}`,
        marginBottom: 40,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 6px" }}>
        DISCORD
      </p>

      {isConnected ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(88,101,242,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#5865F2",
            }}>
              {DISCORD_ICON}
            </div>
            <div>
              <p style={{ color: "#f5f5f5", fontSize: 14, fontWeight: 600, margin: 0 }}>
                @{discordUsername ?? "connected"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "2px 0 0" }}>
                Verified Discord account
              </p>
            </div>
            <span style={{
              background: "rgba(0,255,136,0.1)", color: "#00ff88",
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              letterSpacing: "0.05em",
            }}>
              LINKED
            </span>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            style={{
              padding: "8px 16px", borderRadius: 8,
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 600, fontSize: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: disconnecting ? "not-allowed" : "pointer",
              opacity: disconnecting ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
            Connect your Discord to get automatic access to the Floor Pro channels.
          </p>
          <a
            href="/api/discord/connect"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 20px", borderRadius: 10,
              background: "#5865F2", color: "#fff",
              fontWeight: 700, fontSize: 13,
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            {DISCORD_ICON}
            Connect Discord
          </a>
        </div>
      )}
    </div>
  );
}
