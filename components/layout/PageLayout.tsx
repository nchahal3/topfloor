import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  withTopPadding?: boolean;
}

export default function PageLayout({ children, withTopPadding = true }: PageLayoutProps) {
  return (
    <>
      <Navbar />
      <main style={{ background: "#0a0a0a", minHeight: "100vh", paddingTop: withTopPadding ? 64 : 0 }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
