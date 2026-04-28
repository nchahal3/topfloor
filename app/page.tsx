import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsTicker from "@/components/StatsTicker";
import About from "@/components/About";
import FeatureTeasers from "@/components/FeatureTeasers";
import CommunityCTA from "@/components/CommunityCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsTicker />
        <About />
        <FeatureTeasers />
        <CommunityCTA />
      </main>
      <Footer />
    </>
  );
}
