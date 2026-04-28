import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import FAQ from "@/components/FAQ";

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
    </PageLayout>
  );
}
