import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Calendar,
  Video,
  Trophy,
  User,
  HelpCircle,
} from "lucide-react";

export const NAV_LINKS = [
  { href: "/features", label: "What You Get" },
  { href: "/pricing", label: "Pricing" },
  { href: "/funded-accounts", label: "Get Funded" },
  { href: "/contact", label: "Contact" },
];

export const ABOUT_LINKS = [
  { href: "/about", label: "Our Coaches", icon: User, desc: "Meet the team" },
  { href: "/results", label: "Results", icon: Trophy, desc: "Member wins & payouts" },
  { href: "/faq", label: "FAQ", icon: HelpCircle, desc: "Common questions" },
];

export const MEMBER_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Your member overview" },
  { href: "/dashboard/funded-accounts", label: "Funded Accounts", icon: TrendingUp, desc: "Promo codes & prop firms" },
  { href: "/dashboard/curriculum", label: "Curriculum", icon: BookOpen, desc: "Coaching sessions & videos" },
  { href: "/dashboard/achievements", label: "Achievements", icon: Trophy, desc: "Your certs & payouts" },
  { href: "/dashboard/book-a-call", label: "Book a Call", icon: Calendar, desc: "Schedule with our coaches" },
  { href: "/dashboard/upcoming-classes", label: "Upcoming Classes", icon: Video, desc: "Live session schedule" },
];
