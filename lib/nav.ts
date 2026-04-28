import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Calendar,
  Video,
  Trophy,
} from "lucide-react";

export const NAV_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/features", label: "What You Get" },
  { href: "/results", label: "Results" },
  { href: "/pricing", label: "Pricing" },
  { href: "/funded-accounts", label: "Get Funded" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export const MEMBER_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Your member overview" },
  { href: "/dashboard/funded-accounts", label: "Funded Accounts", icon: TrendingUp, desc: "Promo codes & prop firms" },
  { href: "/dashboard/curriculum", label: "Curriculum", icon: BookOpen, desc: "Coaching sessions & videos" },
  { href: "/dashboard/achievements", label: "Achievements", icon: Trophy, desc: "Your certs & payouts" },
  { href: "/dashboard/book-a-call", label: "Book a Call", icon: Calendar, desc: "Schedule with Coach Floor" },
  { href: "/dashboard/upcoming-classes", label: "Upcoming Classes", icon: Video, desc: "Live session schedule" },
];
