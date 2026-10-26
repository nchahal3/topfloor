import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";

export const metadata = { title: "Pricing | 🔝Floor" };

export default function PricingPage() {
  return (
    <PageLayout>
      <PageHeader
        label="Membership"
        title="Choose Your Level"
        subtitle="No hidden fees. Cancel anytime. Start trading smarter today."
      />
      <Pricing />
      <FAQ />
    </PageLayout>
  );
}
