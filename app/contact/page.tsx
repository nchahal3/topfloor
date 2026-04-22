"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type FormData = {
  name: string;
  email: string;
  message: string;
};

export default function ContactPage() {
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
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-32" style={{ background: "#0a0a0a" }}>
        <div className="w-full max-w-lg">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#00ff88" }}>
            CONTACT US
          </p>
          <h1 className="display-font text-5xl sm:text-6xl text-white mb-3">
            Get in Touch
          </h1>
          <p className="text-white/50 mb-10">
            Have questions? We typically respond within 24 hours.
          </p>

          {submitted ? (
            <div
              className="rounded-2xl p-8 text-center border"
              style={{ background: "#111", borderColor: "rgba(0,255,136,0.3)" }}
            >
              <div className="text-4xl mb-4">✅</div>
              <h2 className="display-font text-3xl text-white mb-2">Message Sent!</h2>
              <p className="text-white/60">
                Thanks! We&apos;ll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-2xl p-8 flex flex-col gap-5 border"
              style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 border outline-none transition-all"
                  style={{
                    background: "#0a0a0a",
                    borderColor: errors.name ? "#ff4444" : "rgba(255,255,255,0.1)",
                  }}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
                  })}
                  type="email"
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 border outline-none transition-all"
                  style={{
                    background: "#0a0a0a",
                    borderColor: errors.email ? "#ff4444" : "rgba(255,255,255,0.1)",
                  }}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Message
                </label>
                <textarea
                  {...register("message", { required: "Message is required" })}
                  rows={5}
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 border outline-none transition-all resize-none"
                  style={{
                    background: "#0a0a0a",
                    borderColor: errors.message ? "#ff4444" : "rgba(255,255,255,0.1)",
                  }}
                  placeholder="Tell us how we can help..."
                />
                {errors.message && (
                  <p className="text-xs mt-1" style={{ color: "#ff4444" }}>
                    {errors.message.message}
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
                className="btn-primary w-full py-4 text-base mt-2 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
