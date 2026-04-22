import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
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
  title: "🔝Floor | Elite Day Trading Coaching",
  description:
    "Join 1,200+ traders at 🔝Floor. Live trading sessions, real-time alerts, private Discord, and 1-on-1 mentorship with Coach Floor — a 7-year professional trader.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${dmSans.variable}`}

    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
