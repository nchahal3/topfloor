"use client";

import { useSignUp } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", discord: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({
        firstName: form.firstName,
        lastName: form.lastName,
        emailAddress: form.email,
        password: form.password,
        unsafeMetadata: { discord: form.discord },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string }> };
      setError(clerkErr.errors?.[0]?.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string }> };
      setError(clerkErr.errors?.[0]?.message ?? "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f5f5f5", fontSize: 14, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", color: "rgba(255,255,255,0.5)", fontSize: 12,
    fontWeight: 600, marginBottom: 6, letterSpacing: "0.04em",
  };

  return (
    <main style={{ position: "relative", overflow: "hidden", background: "#0a0a0a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* neon background in our style */}
      <Image src="/about-banner.png" alt="" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center", zIndex: 0 }} />
      {/* black overlay behind the form */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 0 }} />

      <Link href="/" style={{ position: "relative", zIndex: 1, marginBottom: 32 }}>
        <Image src="/Logo.png" alt="TopFloor Trades" width={150} height={60} style={{ objectFit: "contain", width: 150, height: "auto" }} />
      </Link>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, background: "#111", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 0 40px rgba(0,255,136,0.08)", padding: "32px 28px" }}>

        {step === "form" ? (
          <>
            <h1 style={{ color: "#f5f5f5", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Create your account</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>Join 🔝Floor and start trading smarter.</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} placeholder="John" value={form.firstName} onChange={set("firstName")} required autoComplete="given-name" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} placeholder="Doe" value={form.lastName} onChange={set("lastName")} required autoComplete="family-name" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoComplete="email" />
              </div>

              <div>
                <label style={labelStyle}>Discord Username</label>
                <input style={inputStyle} placeholder="yourname or yourname#1234" value={form.discord} onChange={set("discord")} autoComplete="off" />
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 5 }}>Used to grant Discord access when you subscribe.</p>
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 42 }}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center" }}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p style={{ color: "#ff4444", fontSize: 13, margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || !form.firstName || !form.email || !form.password}
                style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>

            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
              Already have an account?{" "}
              <Link href="/sign-in" style={{ color: "#00ff88", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ color: "#f5f5f5", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Check your email</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>
              We sent a 6-digit code to <span style={{ color: "#f5f5f5" }}>{form.email}</span>
            </p>

            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Verification Code</label>
                <input
                  style={{ ...inputStyle, fontSize: 22, letterSpacing: "0.3em", textAlign: "center" }}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {error && <p style={{ color: "#ff4444", fontSize: 13, margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setStep("form")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", marginTop: 16, display: "block", width: "100%", textAlign: "center" }}
            >
              ← Back
            </button>
          </>
        )}
      </div>

      <p style={{ position: "relative", zIndex: 1, color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 20, textAlign: "center", maxWidth: 360 }}>
        By signing up you agree to our terms. Trading involves significant risk.
      </p>
    </main>
  );
}
