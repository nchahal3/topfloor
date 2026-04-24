"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError("Wrong password. Try again.");
    }
  };

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 40, width: 360 }}>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 36, marginTop: 0, marginBottom: 8 }}>
          🔝Floor Admin
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 24, fontSize: 14 }}>Members dashboard</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#f5f5f5",
              fontSize: 14,
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {error && <p style={{ color: "#ff4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#00ff88",
              color: "#000",
              fontWeight: 700,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Checking..." : "Login →"}
          </button>
        </form>
      </div>
    </main>
  );
}
