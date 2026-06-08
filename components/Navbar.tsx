"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { NAV_LINKS, MEMBER_LINKS } from "@/lib/nav";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMembersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (pathname === "/") {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,10,10,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center"
          >
            <Image src="/Logo.png" alt="TopFloor Trades" width={100} height={100} style={{ objectFit: "contain" }} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: isActive ? "#00ff88" : "rgba(255,255,255,0.65)" }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Members dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMembersOpen((o) => !o)}
                className="flex items-center gap-1 text-sm font-medium transition-colors duration-200"
                style={{ color: membersOpen ? "#00ff88" : "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Members
                <ChevronDown size={14} style={{ transform: membersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>

              {membersOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 16px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 280,
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: 8,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.06)",
                  }}
                >
                  {MEMBER_LINKS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMembersOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, textDecoration: "none", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,255,136,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={14} style={{ color: "#00ff88" }} />
                        </div>
                        <div>
                          <p style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600, margin: 0 }}>{item.label}</p>
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {isSignedIn ? (
              <UserButton
                appearance={{
                  variables: {
                    colorBackground: "#111",
                    colorText: "#f5f5f5",
                    colorPrimary: "#00ff88",
                  },
                  elements: {
                    avatarBox: { width: 34, height: 34 },
                    userButtonPopoverCard: { background: "#111", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" },
                    userButtonPopoverActions: { background: "#111" },
                    userButtonPopoverActionButton: { color: "#f5f5f5" },
                    userButtonPopoverActionButtonText: { color: "#f5f5f5" },
                    userButtonPopoverActionButtonIcon: { color: "rgba(255,255,255,0.5)" },
                    userButtonPopoverFooter: { background: "#0d0d0d", borderTop: "1px solid rgba(255,255,255,0.06)" },
                    userPreviewMainIdentifier: { color: "#f5f5f5" },
                    userPreviewSecondaryIdentifier: { color: "rgba(255,255,255,0.4)" },
                  },
                }}
              />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  Member Login
                </Link>
                <Link href="/sign-up" className="btn-primary px-6 py-2 text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="lg:hidden text-white p-1"
            onClick={() => setIsOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden border-t"
          style={{ background: "rgba(10,10,10,0.98)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="px-4 py-5 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="py-2.5 text-base font-medium"
                style={{ color: pathname === link.href ? "#00ff88" : "rgba(255,255,255,0.75)", textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Members section */}
            <button
              type="button"
              onClick={() => setMobileMembersOpen((o) => !o)}
              className="flex items-center justify-between w-full py-2.5 text-base font-medium"
              style={{ color: "rgba(255,255,255,0.75)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <span>Members</span>
              <ChevronDown size={16} style={{ transform: mobileMembersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "rgba(255,255,255,0.4)" }} />
            </button>

            {mobileMembersOpen && (
              <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 }}>
                {MEMBER_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", textDecoration: "none" }}
                    >
                      <Icon size={14} style={{ color: "#00ff88", flexShrink: 0 }} />
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/sign-in" className="py-2 text-base font-medium" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                Member Login
              </Link>
              <Link href="/sign-up" className="btn-primary py-3 text-sm text-center">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
