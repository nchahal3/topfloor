import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main
      style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <a
        href="/"
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', cursive",
          fontSize: 28,
          color: "#00ff88",
          textDecoration: "none",
          letterSpacing: "0.05em",
          marginBottom: 32,
        }}
      >
        🔝Floor
      </a>
      <SignUp
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
            otpCodeFieldInput: { background: "#1a1a1a", color: "#f5f5f5", borderColor: "rgba(255,255,255,0.2)" },
            formFieldInput: { background: "#1a1a1a", color: "#f5f5f5", borderColor: "rgba(255,255,255,0.12)" },
          },
        }}
      />
    </main>
  );
}
