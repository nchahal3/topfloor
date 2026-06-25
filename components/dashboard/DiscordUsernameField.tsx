"use client";

import { useState } from "react";

export default function DiscordUsernameField({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/profile/discord", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordUsername: value.trim() }),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 16,
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 40,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 6px" }}>
        DISCORD USERNAME
      </p>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 14px" }}>
        Add your Discord username so we can find you in the server.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus("idle"); }}
          placeholder="e.g. traderjohn99"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "10px 14px",
            borderRadius: 10,
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f5f5f5",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            background: status === "saved" ? "rgba(0,255,136,0.15)" : "#00ff88",
            color: status === "saved" ? "#00ff88" : "#000",
            fontWeight: 700,
            fontSize: 13,
            border: status === "saved" ? "1px solid rgba(0,255,136,0.3)" : "none",
            cursor: status === "saving" ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ color: "#ff4444", fontSize: 12, marginTop: 8 }}>
          Failed to save. Please try again.
        </p>
      )}
    </div>
  );
}
