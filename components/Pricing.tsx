"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: 47,
    badge: null,
    featured: false,
    features: [
      "Private Discord Access",
      "Daily Market Recaps",
      "Weekly Trade Alerts",
      "Community Chat",
      "Educational Resources",
    ],
    cta: "Get Started",
  },
  {
    name: "Elite",
    price: 97,
    badge: "MOST POPULAR",
    featured: true,
    features: [
      "Everything in Starter",
      "Live Morning Sessions (M–F)",
      "Daily Trade Alerts",
      "Trade Journal Templates",
      "Members-Only Replays",
      "Priority Discord Channels",
    ],
    cta: "Join Elite",
  },
  {
    name: "VIP",
    price: 247,
    badge: "BEST VALUE",
    featured: false,
    features: [
      "Everything in Elite",
      "Monthly 1-on-1 with Coach Floor",
      "VIP Private Chat Access",
      "Priority Support (24hr)",
      "Personalized Trade Reviews",
      "Annual Strategy Session",
    ],
    cta: "Go VIP",
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-28"
      style={{ background: "#0d0d0d" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#00ff88" }}
          >
            Membership Plans
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
            Choose Your Level
          </h2>
          <p
            className="text-base max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            All plans include access to the private Discord community.
            Upgrade anytime. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="relative rounded-2xl p-8 border flex flex-col"
              style={
                plan.featured
                  ? {
                      background: "#111",
                      borderColor: "rgba(0,255,136,0.5)",
                      boxShadow:
                        "0 0 0 1px rgba(0,255,136,0.4), 0 0 40px rgba(0,255,136,0.12)",
                      transform: "scale(1.03)",
                    }
                  : {
                      background: "#111",
                      borderColor: "rgba(255,255,255,0.06)",
                    }
              }
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold tracking-widest"
                  style={
                    plan.featured
                      ? { background: "#00ff88", color: "#000" }
                      : { background: "#f0c040", color: "#000" }
                  }
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <p
                className="text-xs font-bold tracking-widest uppercase mb-2"
                style={{ color: plan.featured ? "#00ff88" : "rgba(255,255,255,0.4)" }}
              >
                {plan.name}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span
                  className="display-font text-6xl"
                  style={{ color: plan.featured ? "#00ff88" : "#f5f5f5" }}
                >
                  ${plan.price}
                </span>
                <span
                  className="text-sm ml-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  / month
                </span>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0"
                      style={{ color: plan.featured ? "#00ff88" : "rgba(0,255,136,0.6)" }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="https://discord.gg/kxnfaPNC"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-center py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                  plan.featured ? "btn-primary" : "btn-outline"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <p
          className="text-center text-xs mt-10"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          All memberships are month-to-month. No long-term contracts. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
