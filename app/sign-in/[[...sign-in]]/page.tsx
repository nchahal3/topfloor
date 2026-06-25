import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <main
      style={{
        position: "relative",
        background: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "hidden",
      }}
    >
      {/* branded background — neon charts top & bottom, dark clear center */}
      <Image
        src="/signin-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center", zIndex: 0 }}
      />
      {/* center vignette so the logo + card stay crisp */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse 70% 60% at center, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.84) 55%, rgba(10,10,10,0.96) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* real brand logo (matches the navbar) */}
        <a href="/" style={{ marginBottom: 28, display: "inline-block" }}>
          <Image
            src="/Logo.png"
            alt="TopFloor Trades"
            width={210}
            height={140}
            priority
            style={{ width: 200, height: "auto", objectFit: "contain" }}
          />
        </a>

        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#00ff88",
              colorBackground: "#111111",
              colorText: "#f5f5f5",
              colorInputBackground: "#1a1a1a",
              colorInputText: "#f5f5f5",
              borderRadius: "12px",
            },
            elements: {
              card: { boxShadow: "0 0 40px rgba(0,255,136,0.08)", border: "1px solid rgba(255,255,255,0.06)" },
              headerTitle: { color: "#f5f5f5" },
              headerSubtitle: { color: "rgba(255,255,255,0.45)" },
              formButtonPrimary: { backgroundColor: "#00ff88", color: "#000", fontWeight: 700 },
              footerActionLink: { color: "#00ff88" },
              footerActionText: { color: "rgba(255,255,255,0.45)" },
              formFieldLabel: { color: "rgba(255,255,255,0.6)" },
              formFieldHintText: { color: "rgba(255,255,255,0.35)" },
              formFieldSuccessText: { color: "#00ff88" },
              formFieldErrorText: { color: "#ff4444" },
              identityPreviewText: { color: "#f5f5f5" },
              identityPreviewEditButton: { color: "#00ff88" },
              dividerText: { color: "rgba(255,255,255,0.3)" },
              dividerLine: { background: "rgba(255,255,255,0.08)" },
              otpCodeFieldInput: { background: "#1a1a1a", color: "#f5f5f5", borderColor: "rgba(255,255,255,0.2)" },
              formFieldInput: { background: "#1a1a1a", color: "#f5f5f5", borderColor: "rgba(255,255,255,0.12)" },
              formFieldInputShowPasswordButton: { color: "rgba(255,255,255,0.4)" },
              alternativeMethodsBlockButton: { color: "#f5f5f5", borderColor: "rgba(255,255,255,0.1)", background: "#1a1a1a" },
            },
          }}
        />
      </div>
    </main>
  );
}
