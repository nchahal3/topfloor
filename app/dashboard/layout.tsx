import { currentUser } from "@clerk/nextjs/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Tier } from "@/lib/tier";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const pendingLifetime = user?.publicMetadata?.pendingLifetime === true;

  return (
    <DashboardShell>
      {pendingLifetime && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "linear-gradient(90deg, #f0c040, #e6a800)",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
          flexWrap: "wrap",
        }}>
          <span style={{ color: "#000", fontWeight: 700, fontSize: 14 }}>
            ⚠️ Your access is paused. Complete your Lifetime payment to restore full access.
          </span>
          <a
            href="/api/checkout/lifetime"
            style={{
              background: "#000", color: "#f0c040", fontWeight: 700,
              fontSize: 13, padding: "6px 18px", borderRadius: 999,
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Complete Payment →
          </a>
        </div>
      )}
      <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", paddingTop: pendingLifetime ? 48 : 0 }}>
        <DashboardSidebar tier={tier} />
        <main
          style={{ flex: 1, overflowY: "auto" }}
          className="pt-[60px] lg:pt-0"
        >
          {children}
        </main>
      </div>
    </DashboardShell>
  );
}
