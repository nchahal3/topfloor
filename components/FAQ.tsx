"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Do I need trading experience to join?",
    a: "Not at all. 🔝Floor has members who had never placed a trade before joining, and members who have been trading for years. Coach Floor explains every setup with full context so it actually makes sense, regardless of where you're starting from.",
  },
  {
    q: "What markets do you trade?",
    a: "Mostly stocks and futures, with options setups mixed in when the conditions are right. Everything Coach Floor teaches is what he's actually trading. No hypotheticals, no paper portfolios.",
  },
  {
    q: "What time are the live sessions?",
    a: "Live sessions run Monday through Friday starting at 9:15 AM EST, right before market open. Sessions typically run 60–90 minutes and cover pre-market analysis, live entries, and post-session breakdowns. All sessions are recorded.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Month-to-month, no contracts. Cancel straight from your dashboard whenever you want. No phone calls, no guilt emails, nothing like that.",
  },
  {
    q: "How do I get trade alerts?",
    a: "Alerts go straight into the private Discord the moment a setup is live. If you have the Discord app on your phone you'll get a push notification too. Most members say they've never been faster to a move.",
  },
  {
    q: "Is this a get-rich-quick scheme?",
    a: "No. Trading is a skill and it takes real work to develop. What we give you is a proven process, live guidance, and people around you who are putting in the same work. What you do with it is up to you.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      id="faq"
      className="py-20 sm:py-28"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
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
            Questions & Answers
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none">
            Common Questions
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-xl overflow-hidden border"
              style={{
                background: "#111",
                borderColor:
                  openIndex === i
                    ? "rgba(0,255,136,0.3)"
                    : "rgba(255,255,255,0.06)",
              }}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              >
                <span className="text-base font-semibold text-white">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="shrink-0"
                  style={{ color: openIndex === i ? "#00ff88" : "rgba(255,255,255,0.4)" }}
                >
                  <ChevronDown size={20} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="faq-answer"
                  >
                    <p
                      className="px-6 pb-5 text-sm leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
