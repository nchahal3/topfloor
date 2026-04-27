import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import WhatYouGet from "@/components/WhatYouGet";

export const metadata = { title: "What You Get | 🔝Floor" };

export default function FeaturesPage() {
  return (
    <PageLayout>
      <PageHeader
        label="Membership Benefits"
        title="What You Get"
        subtitle="Everything included in your 🔝Floor membership — from day one."
      />
      <WhatYouGet />
    </PageLayout>
  );
}
