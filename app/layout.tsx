import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "TopFloor | Elite Day Trading Coaching",
  description:
    "Join 1,200+ traders at TopFloor. Live trading sessions, real-time alerts, private Discord, and 1-on-1 mentorship with Coach Floor — a 7-year professional trader.",
  metadataBase: new URL("https://www.topfloortradesofficial.com"),
  openGraph: {
    title: "TopFloor | Elite Day Trading Coaching",
    description:
      "Live trade alerts, private Discord, full curriculum, and 1-on-1 mentorship. Trade from the top — every single day.",
    url: "https://www.topfloortradesofficial.com",
    siteName: "TopFloor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TopFloor — Elite Day Trading Coaching",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TopFloor | Elite Day Trading Coaching",
    description:
      "Live trade alerts, private Discord, full curriculum, and 1-on-1 mentorship. Trade from the top — every single day.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable}`}>
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
