import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import LoadingScreen from "@/components/LoadingScreen";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TopFloor | Elite Day Trading Coaching",
  description:
    "Join 1,200+ traders at TopFloor. Live trading sessions, real-time alerts, private Discord, and 1-on-1 mentorship with the TopFloor team of seasoned professional traders.",
  metadataBase: new URL("https://www.topfloortradesofficial.com"),
  openGraph: {
    title: "TopFloor | Elite Day Trading Coaching",
    description:
      "Live trade alerts, private Discord, full curriculum, and 1-on-1 mentorship. Trade from the top — every single day.",
    url: "https://www.topfloortradesofficial.com",
    siteName: "TopFloor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TopFloor | Elite Day Trading Coaching",
    description:
      "Live trade alerts, private Discord, full curriculum, and 1-on-1 mentorship. Trade from the top — every single day.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${bebasNeue.variable} ${dmSans.variable} ${spaceGrotesk.variable}`}
      >
        <body className="min-h-screen antialiased">
          <LoadingScreen />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
