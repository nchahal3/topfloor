"use client";

import { useState } from "react";

const DISCORD_ICON = (
  <svg width="18" height="14" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
  const [confirming, setConfirming] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/discord/disconnect", { method: "POST" });
      setDisconnected(true);
    } catch {
      // silent - page reload will reflect truth
    } finally {
      setDisconnecting(false);
      setConfirming(false);
    }
  }

  const isConnected = !disconnected && !!discordUserId;

  return (
    <div
      style={{
        borderRadius: 16,
        marginBottom: 40,
        overflow: "hidden",
        border: `1px solid ${isConnected ? "rgba(88,101,242,0.3)" : "rgba(255,255,255,0.08)"}`,
        background: isConnected
          ? "linear-gradient(135deg, rgba(88,101,242,0.12) 0%, rgba(88,101,242,0.04) 100%)"
          : "#111",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: isConnected
          ? "linear-gradient(90deg, #5865F2, #7289da)"
          : "rgba(255,255,255,0.06)",
      }} />

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: isConnected ? "rgba(88,101,242,0.2)" : "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isConnected ? "#5865F2" : "rgba(255,255,255,0.3)",
            flexShrink: 0,
          }}>
            {DISCORD_ICON}
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", margin: 0, textTransform: "uppercase" }}>
            Discord
          </p>
          {isConnected && (
            <span style={{
              marginLeft: 2,
              background: "rgba(0,255,136,0.12)",
              color: "#00ff88",
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 999,
              letterSpacing: "0.06em",
              border: "1px solid rgba(0,255,136,0.2)",
            }}>
              CONNECTED
            </span>
          )}
        </div>

        {isConnected ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ color: "#f5f5f5", fontSize: 16, fontWeight: 700, margin: "0 0 3px" }}>
                  @{discordUsername ?? "connected"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
                  Verified - has access to Floor Pro channels
                </p>
              </div>
              {!confirming && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  style={{
                    padding: "8px 18px", borderRadius: 9,
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 600, fontSize: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  Disconnect
                </button>
              )}
            </div>
            {confirming && (
              <div style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: 10,
                background: "rgba(255,60,60,0.07)",
                border: "1px solid rgba(255,60,60,0.2)",
              }}>
                <p style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
                  Remove Discord access?
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 12px" }}>
                  You'll lose the Pro Memer role and Floor Pro channels until you reconnect.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 600, fontSize: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      background: disconnecting ? "rgba(255,60,60,0.2)" : "rgba(255,60,60,0.15)",
                      color: disconnecting ? "rgba(255,80,80,0.5)" : "#ff4444",
                      fontWeight: 700, fontSize: 12,
                      border: "1px solid rgba(255,60,60,0.3)",
                      cursor: disconnecting ? "not-allowed" : "pointer",
                    }}
                  >
                    {disconnecting ? "Disconnecting…" : "Yes, disconnect"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <p style={{ color: "#f5f5f5", fontSize: 14, fontWeight: 600, margin: "0 0 3px" }}>
                Connect your Discord account
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
                Get automatic access to the Floor Pro channels.
              </p>
            </div>
            <a
              href="/api/discord/connect"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 10,
                background: "#5865F2",
                boxShadow: "0 4px 16px rgba(88,101,242,0.35)",
                color: "#fff",
                fontWeight: 700, fontSize: 13,
                textDecoration: "none", whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }}
            >
              {DISCORD_ICON}
              Connect Discord
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
