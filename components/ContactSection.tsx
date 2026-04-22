"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type FormData = {
  name: string;
  email: string;
  experience: string;
  challenge: string;
};

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Select your level..." },
  { value: "beginner", label: "Complete beginner, never traded before" },
  { value: "some", label: "Some experience, still figuring it out" },
  { value: "struggling", label: "Experienced but struggling to be consistent" },
  { value: "mentorship", label: "Looking for 1-on-1 mentorship" },
];

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 sm:py-28"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#00ff88" }}
          >
            Let&apos;s Talk
          </p>
          <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
            Not Sure Where to Start?
          </h2>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tell us where you&apos;re at. We&apos;ll give you a straight answer on what makes sense for you, nothing more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {submitted ? (
            <div
              className="rounded-2xl p-10 text-center border mb-6"
              style={{
                background: "#111",
                borderColor: "rgba(0,255,136,0.3)",
              }}
            >
              <div className="text-5xl mb-4">✅</div>
              <h3 className="display-font text-3xl text-white mb-2">
                Got it, we&apos;ll be in touch!
              </h3>
              <p className="mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                Expect a reply within 24 hours. In the meantime, come hang in the Discord.
              </p>
              <a
                href="https://discord.gg/kxnfaPNC"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block px-7 py-3 text-sm"
              >
                Join the Discord Now
              </a>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="rounded-2xl p-8 flex flex-col gap-5 border mb-5"
                style={{
                  background: "#111",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      Name
                    </label>
                    <input
                      {...register("name", { required: "Required" })}
                      className="w-full rounded-xl px-4 py-3 text-white border outline-none"
                      style={{
                        background: "#0a0a0a",
                        borderColor: errors.name ? "#ff4444" : "rgba(255,255,255,0.08)",
                        caretColor: "#00ff88",
                      }}
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      Email
                    </label>
                    <input
                      {...register("email", {
                        required: "Required",
                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                      })}
                      type="email"
                      className="w-full rounded-xl px-4 py-3 text-white border outline-none"
                      style={{
                        background: "#0a0a0a",
                        borderColor: errors.email ? "#ff4444" : "rgba(255,255,255,0.08)",
                        caretColor: "#00ff88",
                      }}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Experience dropdown */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    What best describes you?
                  </label>
                  <div className="relative">
                    <select
                      {...register("experience", { required: "Please select an option" })}
                      defaultValue=""
                      className="w-full rounded-xl px-4 py-3 border outline-none appearance-none cursor-pointer pr-10"
                      style={{
                        background: "#0a0a0a",
                        borderColor: errors.experience ? "#ff4444" : "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      <option value="" disabled style={{ color: "rgba(255,255,255,0.3)" }}>
                        — Pick your level —
                      </option>
                      {EXPERIENCE_OPTIONS.filter(o => o.value !== "").map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ background: "#111", color: "#f5f5f5" }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <ChevronDown size={18} />
                    </div>
                  </div>
                  {errors.experience && (
                    <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                      {errors.experience.message}
                    </p>
                  )}
                </div>

                {/* Challenge text field */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    What&apos;s your biggest trading challenge right now?
                  </label>
                  <textarea
                    {...register("challenge", { required: "Required" })}
                    rows={4}
                    className="w-full rounded-xl px-4 py-3 text-white border outline-none resize-none"
                    style={{
                      background: "#0a0a0a",
                      borderColor: errors.challenge ? "#ff4444" : "rgba(255,255,255,0.08)",
                      caretColor: "#00ff88",
                    }}
                    placeholder="e.g. I keep getting stopped out, I don't know when to enter, I blow up my account when I'm up..."
                  />
                  {errors.challenge && (
                    <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                      {errors.challenge.message}
                    </p>
                  )}
                </div>

                {sendError && (
                  <p className="text-sm text-center" style={{ color: "#ff4444" }}>
                    {sendError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full py-4 text-base disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Get Personalized Advice →"}
                </button>
              </form>

              {/* Secondary Discord nudge */}
              <div
                className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border"
                style={{
                  background: "rgba(0,255,136,0.05)",
                  borderColor: "rgba(0,255,136,0.15)",
                }}
              >
                <div>
                  <p className="font-semibold text-white text-sm">
                    Ready to jump in right now?
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Skip the wait. Join the Discord and start today.
                  </p>
                </div>
                <a
                  href="https://discord.gg/kxnfaPNC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary shrink-0 px-5 py-2.5 text-sm"
                >
                  Join Discord →
                </a>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
