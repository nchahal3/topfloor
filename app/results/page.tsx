import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import Testimonials from "@/components/Testimonials";
import FundedWins from "@/components/FundedWins";

export const metadata = { title: "Results | 🔝Floor" };

export default function ResultsPage() {
  return (
    <PageLayout>
      <PageHeader
        label="Proof of Work"
        title="Real Results"
        subtitle="Real traders. Real profits. See what the 🔝Floor community has achieved."
      />
      <Testimonials />
      <FundedWins />
    </PageLayout>
  );
}
