import { currentUser } from "@clerk/nextjs/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { Tier } from "@/lib/tier";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>
      <DashboardSidebar tier={tier} />
      <main
        style={{ flex: 1, overflowY: "auto" }}
        className="pt-[60px] lg:pt-0"
      >
        {children}
      </main>
    </div>
  );
}
