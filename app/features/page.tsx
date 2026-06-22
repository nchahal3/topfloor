import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import WhatYouGet from "@/components/WhatYouGet";
import BottomCTA from "@/components/BottomCTA";

export const metadata = { title: "What You Get | 🔝Floor" };

export default function FeaturesPage() {
  return (
    <PageLayout withTopPadding={false}>
      <PageHeader
        label="Membership Benefits"
        title="What You Get"
        subtitle="Everything included in your 🔝Floor membership, from day one."
        image="/whatyouget-banner.png"
      />
      <WhatYouGet />
      <BottomCTA
        headline="Everything You Need Is Right Here."
        sub="Live sessions, trade alerts, community, and more — all in one membership."
      />
    </PageLayout>
  );
}
