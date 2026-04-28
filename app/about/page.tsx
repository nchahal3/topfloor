import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import About from "@/components/About";

export const metadata = { title: "About Coach Floor | 🔝Floor" };

export default function AboutPage() {
  return (
    <PageLayout>
      <PageHeader
        label="The Coach"
        title="About Coach Floor"
        subtitle="7 years in the markets. One mission — give everyday traders access to institutional-level strategy."
      />
      <About />
    </PageLayout>
  );
}
