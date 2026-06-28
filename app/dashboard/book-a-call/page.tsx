import { currentUser } from "@clerk/nextjs/server";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import type { Tier } from "@/lib/tier";
import BookingForm from "@/components/dashboard/BookingForm";
import MyBookings from "@/components/dashboard/MyBookings";

export default async function BookACallPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const gracePeriodEnd = (user?.publicMetadata?.gracePeriodEnd as string) ?? null;
  const graceExpired = gracePeriodEnd ? new Date(gracePeriodEnd) < new Date() : false;
  const effectiveTier: Tier = graceExpired ? null : tier;

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
          Schedule time directly with the TopFloor team. Free intro calls available for all members — subscribers get trade review sessions.
        </p>
      </div>

      {/* Call types */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 36 }}>
        <div style={{ padding: "20px", borderRadius: 14, background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)" }}>
          <Calendar size={18} style={{ color: "#00ff88", marginBottom: 10 }} />
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Intro Call</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
            15-min call with the TopFloor team. Learn about the platform and ask any questions.
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "3px 8px", borderRadius: 5 }}>
            FREE — All Members
          </span>
        </div>

        <div style={{ padding: "20px", borderRadius: 14, background: effectiveTier ? "rgba(240,192,64,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${effectiveTier ? "rgba(240,192,64,0.2)" : "rgba(255,255,255,0.06)"}`, opacity: effectiveTier ? 1 : 0.5 }}>
          <Clock size={18} style={{ color: effectiveTier ? "#f0c040" : "rgba(255,255,255,0.3)", marginBottom: 10 }} />
          <p style={{ color: effectiveTier ? "#f5f5f5" : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Trade Review</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
            30-min deep dive. The TopFloor team reviews your trades and gives direct feedback.
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, color: effectiveTier ? "#f0c040" : "rgba(255,255,255,0.3)", background: effectiveTier ? "rgba(240,192,64,0.1)" : "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 5 }}>
            {effectiveTier ? "Included in Your Plan" : "Requires Subscription"}
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
            "Tell us your preferred times and we'll confirm within 24 hours",
            "You'll get a confirmation with a meeting link",
            "Come prepared with your questions or trades to review",
            "The TopFloor team shows up on time, every time",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={15} style={{ color: "#00ff88", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking form */}
      <BookingForm />

      {/* Member's booking history */}
      <MyBookings />
    </div>
  );
}
