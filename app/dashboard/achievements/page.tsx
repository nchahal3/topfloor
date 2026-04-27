import { Upload, Trophy } from "lucide-react";

export default function AchievementsPage() {
  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Free for All Members
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Achievements
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          Track your wins. Upload your funded account certificates, payout confirmations, and evaluation passes.
        </p>
      </div>

      {/* Upload area — coming soon state */}
      <div
        style={{
          padding: "48px 32px",
          borderRadius: 20,
          background: "#111",
          border: "2px dashed rgba(255,255,255,0.08)",
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Upload size={22} style={{ color: "#00ff88" }} />
        </div>
        <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>
          Upload Coming Soon
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Certificate and payout upload will be live shortly. <br />
          Check back in the next update.
        </p>
      </div>

      {/* What you can upload */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {[
          { label: "Evaluation Passes", desc: "Prop firm evaluation completion certificates" },
          { label: "Payout Requests", desc: "Screenshots of your payout confirmations" },
          { label: "Account Milestones", desc: "Hitting profit targets or account goals" },
          { label: "Funded Account Proof", desc: "Confirmation of funded account approvals" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "18px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Trophy size={16} style={{ color: "#f0c040", marginBottom: 8 }} />
            <p style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>{item.label}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
