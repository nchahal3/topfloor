import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import FAQ from "@/components/FAQ";
import BottomCTA from "@/components/BottomCTA";

export const metadata = { title: "FAQ | 🔝Floor" };

export default function FAQPage() {
  return (
    <PageLayout>
      <PageHeader
        label="Got Questions?"
        title="FAQ"
        subtitle="Everything you need to know before joining 🔝Floor."
      />
      <FAQ />
      <BottomCTA
        headline="Questions Answered. Time to Act."
        sub="You know what's included. Join the community and start trading with a real edge."
      />
    </PageLayout>
  );
}
