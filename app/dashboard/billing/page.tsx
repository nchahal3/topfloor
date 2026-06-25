import { currentUser } from "@clerk/nextjs/server";
import type { Tier } from "@/lib/tier";
import BillingSection from "@/components/dashboard/BillingSection";
import CancelMembershipButton from "@/components/dashboard/CancelMembershipButton";
import ChangePlanSection from "@/components/dashboard/ChangePlanSection";

export default async function BillingPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const cancelAt = (user?.publicMetadata?.cancelAt as string) ?? null;
  const isMonthly = tier === "bronze" || tier === "silver" || tier === "gold";

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

        {tier === "lifetime" ? (
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
