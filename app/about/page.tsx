import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import About from "@/components/About";
import BottomCTA from "@/components/BottomCTA";

export const metadata = { title: "About | 🔝Floor" };

export default function AboutPage() {
  return (
    <PageLayout>
      <PageHeader
        label="The Coach"
        title="About Coach Floor"
        subtitle="7 years in the markets. One mission: give everyday traders access to institutional-level strategy."
      />
      <About />
      <BottomCTA
        headline="Stop Trading Alone."
        sub="Join the platform built for traders who are serious about getting funded and staying consistent."
      />
    </PageLayout>
  );
}
