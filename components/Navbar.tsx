"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#what-you-get", label: "What You Get" },
  { href: "#results", label: "Results" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith("#")) {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMobileClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    smoothScroll(e, href);
    setIsOpen(false);
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
            className="display-font text-2xl tracking-wide glow-green-subtle"
            style={{ color: "#00ff88" }}
          >
            🔝Floor
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => smoothScroll(e, link.href)}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.65)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <a
            href="https://discord.gg/kxnfaPNC"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block btn-primary px-6 py-2 text-sm"
          >
            Join Now
          </a>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: "rgba(10,10,10,0.98)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-4 py-5 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleMobileClick(e, link.href)}
                className="py-2 text-base font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://discord.gg/kxnfaPNC"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-2 py-3 text-sm text-center"
            >
              Join Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
