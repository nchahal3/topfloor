import { currentUser } from "@clerk/nextjs/server";
import type { Tier } from "@/lib/tier";
import BillingSection from "@/components/dashboard/BillingSection";
import CancelMembershipButton from "@/components/dashboard/CancelMembershipButton";

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

        {tier && <BillingSection tier={tier} />}
        {isMonthly && <CancelMembershipButton cancelAt={cancelAt} />}
      </div>
    </div>
  );
}
