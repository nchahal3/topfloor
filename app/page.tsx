import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsTicker from "@/components/StatsTicker";
import About from "@/components/About";
import WhatYouGet from "@/components/WhatYouGet";
import Testimonials from "@/components/Testimonials";
import FundedWins from "@/components/FundedWins";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CommunityCTA from "@/components/CommunityCTA";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsTicker />
        <About />
        <WhatYouGet />
        <Testimonials />
        <FundedWins />
        <Pricing />
        <FAQ />
        <ContactSection />
        <CommunityCTA />
      </main>
      <Footer />
    </>
  );
}
