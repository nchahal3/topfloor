"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

const PLANS = [
  {
    id: "foundation",
    name: "Foundation",
    price: "$500",
    period: "/mo",
    badge: null,
    featured: false,
    features: [
      "Live trade signals daily",
      "Private Discord access",
      "Beginner trading guide",
      "Full breakdown of the 🔝Floor system",
      "Daily market recaps",
      "Community chat",
    ],
    cta: "Get Started",
    description: "Everything you need to start trading with a real edge.",
  },
  {
    id: "elite_monthly",
    name: "Elite Mentorship",
    price: "$750",
    period: "/mo",
    badge: "MOST POPULAR",
    featured: true,
    features: [
      "Everything in Foundation",
      "1-on-1 mentoring with Coach Floor",
      "5hrs of video training on the 🔝Floor model",
      "Weekly coaching calls",
      "Access to Coach Floor's personal number",
      "Private group chats",
      "Morning live trades",
    ],
    cta: "Join Elite",
    description: "Full mentorship. Built for traders serious about results.",
  },
];

const LIFETIME = {
  id: "elite_lifetime",
  name: "Elite Lifetime",
  price: "$2,000",
  period: "one-time",
  badge: "BEST VALUE",
  features: [
    "Everything in Elite Mentorship",
    "Never pay monthly again",
    "Lifetime access to all future content",
    "Priority support forever",
  ],
  cta: "Get Lifetime Access",
};

function PlanCard({
  plan,
}: {
  plan: (typeof PLANS)[0];
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative rounded-2xl p-8 border flex flex-col h-full"
      style={
        plan.featured
          ? {
              background: "#111",
              borderColor: "rgba(0,255,136,0.5)",
              boxShadow: "0 0 0 1px rgba(0,255,136,0.3), 0 0 50px rgba(0,255,136,0.1)",
            }
          : { background: "#111", borderColor: "rgba(255,255,255,0.06)" }
      }
    >
      {plan.badge && (
        <div
          className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold tracking-widest"
          style={{ background: "#00ff88", color: "#000" }}
        >
          {plan.badge}
        </div>
      )}

      <p
        className="text-xs font-bold tracking-widest uppercase mb-2"
        style={{ color: plan.featured ? "#00ff88" : "rgba(255,255,255,0.4)" }}
      >
        {plan.name}
      </p>

      <div className="flex items-end gap-1 mb-1">
        <span
          className="display-font text-6xl leading-none"
          style={{ color: plan.featured ? "#00ff88" : "#f5f5f5" }}
        >
          {plan.price}
        </span>
        <span className="text-sm pb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          {plan.period}
        </span>
      </div>

      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        {plan.description}
      </p>

      <ul className="flex flex-col gap-3 flex-1 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <Check
              size={15}
              className="mt-0.5 shrink-0"
              style={{ color: plan.featured ? "#00ff88" : "rgba(0,255,136,0.6)" }}
            />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full py-3.5 rounded-full font-bold text-sm transition-all duration-300 disabled:opacity-50 ${
          plan.featured ? "btn-primary" : "btn-outline"
        }`}
      >
        {loading ? "Redirecting..." : plan.cta}
      </button>
    </div>
  );
}

function LifetimeCard() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: LIFETIME.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-8 border mt-6"
      style={{
        background: "linear-gradient(135deg, #0f1a14 0%, #111 100%)",
        borderColor: "rgba(240,192,64,0.3)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#f0c040" }}
            >
              {LIFETIME.name}
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#f0c040", color: "#000" }}
            >
              {LIFETIME.badge}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span
              className="display-font text-5xl leading-none"
              style={{ color: "#f0c040" }}
            >
              {LIFETIME.price}
            </span>
            <span className="text-sm pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {LIFETIME.period}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {LIFETIME.features.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                <Check size={12} style={{ color: "#f0c040" }} />
                {f}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="shrink-0 px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 disabled:opacity-50"
          style={{
            background: "#f0c040",
            color: "#000",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 0 25px rgba(240,192,64,0.5)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          {loading ? "Redirecting..." : LIFETIME.cta}
        </button>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28" style={{ background: "#0d0d0d" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#00ff88" }}
          >
            Membership
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
            Choose Your Level
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            No hidden fees. Cancel anytime. All prices in CAD.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Two main plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Lifetime deal */}
          <LifetimeCard />
        </motion.div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Secure checkout powered by Stripe. Cancel anytime from your account.
        </p>
      </div>
    </section>
  );
}
