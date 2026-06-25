import { currentUser } from "@clerk/nextjs/server";
import type { Tier } from "@/lib/tier";
import BillingSection from "@/components/dashboard/BillingSection";
import CancelMembershipButton from "@/components/dashboard/CancelMembershipButton";
import ChangePlanSection from "@/components/dashboard/ChangePlanSection";

export default async function BillingPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const cancelAt = (user?.publicMetadata?.cancelAt as string) ?? null;
  const pendingLifetime = user?.publicMetadata?.pendingLifetime === true;
  const isMonthly = tier === "bronze" || tier === "silver" || tier === "gold";
  const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://topfloortradesofficial.com";

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100%" }}>
      <div style={{ padding: "40px 32px", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Billing
          </p>
          <h1 style={{ color: "#f5f5f5", fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Manage your subscription
          </h1>
        </div>

        {pendingLifetime ? (
          <div style={{ padding: "24px 28px", borderRadius: 16, background: "rgba(240,192,64,0.06)", border: "1px solid rgba(240,192,64,0.35)", marginBottom: 32 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 12px" }}>PENDING PAYMENT</p>
            <p style={{ color: "#f0c040", fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Complete your Lifetime payment</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>
              Your monthly subscription has been cancelled. Complete the one-time $2,000 payment to lock in permanent access.
            </p>
            <a
              href={`${BASE_URL}/api/checkout/lifetime`}
              style={{
                display: "inline-block", padding: "10px 24px", borderRadius: 10,
                background: "#f0c040", color: "#000", fontWeight: 700, fontSize: 14,
                textDecoration: "none",
              }}
            >
              Complete Payment →
            </a>
          </div>
        ) : tier === "lifetime" ? (
          <div style={{ padding: "24px 28px", borderRadius: 16, background: "rgba(240,192,64,0.05)", border: "1px solid rgba(240,192,64,0.25)", marginBottom: 32 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", margin: "0 0 16px" }}>MEMBERSHIP</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ background: "rgba(240,192,64,0.15)", color: "#f0c040", fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 999, letterSpacing: "0.05em" }}>
                ♾ LIFETIME
              </span>
            </div>
            <p style={{ color: "#f5f5f5", fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>You have permanent access.</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>You will never be charged again. Your access to 🔝Floor is yours forever.</p>
          </div>
        ) : (
          <>
            {tier && <BillingSection tier={tier} />}
            {isMonthly && <ChangePlanSection currentTier={tier} />}
            {isMonthly && <CancelMembershipButton cancelAt={cancelAt} />}
          </>
        )}
      </div>
    </div>
  );
}
