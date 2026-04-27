import { currentUser } from "@clerk/nextjs/server";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import type { Tier } from "@/lib/tier";

const CALENDLY_URL = "https://calendly.com/REPLACE_WITH_COACH_FLOOR_LINK";

export default async function BookACallPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Free to Book
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Book a Call
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          Schedule time directly with Coach Floor. Free intro calls available for all members — subscribers get trade review sessions.
        </p>
      </div>

      {/* Call types */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 36 }}>
        <div
          style={{
            padding: "20px",
            borderRadius: 14,
            background: "rgba(0,255,136,0.05)",
            border: "1px solid rgba(0,255,136,0.15)",
          }}
        >
          <Calendar size={18} style={{ color: "#00ff88", marginBottom: 10 }} />
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Intro Call</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
            15-min call with Coach Floor. Learn about the platform and ask any questions.
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "3px 8px", borderRadius: 5 }}>
            FREE — All Members
          </span>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: 14,
            background: tier ? "rgba(240,192,64,0.05)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${tier ? "rgba(240,192,64,0.2)" : "rgba(255,255,255,0.06)"}`,
            opacity: tier ? 1 : 0.5,
          }}
        >
          <Clock size={18} style={{ color: tier ? "#f0c040" : "rgba(255,255,255,0.3)", marginBottom: 10 }} />
          <p style={{ color: tier ? "#f5f5f5" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Trade Review</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
            30-min deep dive. Coach Floor reviews your trades and gives direct feedback.
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, color: tier ? "#f0c040" : "rgba(255,255,255,0.3)", background: tier ? "rgba(240,192,64,0.1)" : "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 5 }}>
            {tier ? "Included in Your Plan" : "Requires Subscription"}
          </span>
        </div>
      </div>

      {/* What to expect */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>
          What to Expect
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Pick a date and time that works for you",
            "You'll get a confirmation email with a Zoom link",
            "Come prepared with your questions or trades to review",
            "Coach Floor shows up on time, every time",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={15} style={{ color: "#00ff88", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendly embed placeholder */}
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "#111",
          minHeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: "40px",
          textAlign: "center",
        }}
      >
        <Calendar size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: 0 }}>
          Calendar booking will appear here once Coach Floor&apos;s Calendly is connected.
        </p>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "12px 28px",
            borderRadius: 999,
            background: "#00ff88",
            color: "#000",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Open Booking Calendar →
        </a>
      </div>
    </div>
  );
}
