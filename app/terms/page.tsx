import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TopFloor",
  description: "Terms and conditions for using TopFloor's trading coaching services.",
};

export default function TermsPage() {
  const updated = "May 26, 2025";

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingTop: 96 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>
        <Link href="/" className="display-font text-2xl glow-green-subtle" style={{ color: "#00ff88", textDecoration: "none" }}>
          🔝Floor
        </Link>

        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 48, margin: "32px 0 8px", lineHeight: 1 }}>
          Terms of Service
        </h1>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 48 }}>Last updated: {updated}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <Section title="1. Acceptance of Terms">
            By accessing or using TopFloor&apos;s website (topfloortradesofficial.com) and services, you agree to be bound by these Terms of Service. If you do not agree, do not use our services. We reserve the right to update these terms at any time, with changes effective upon posting.
          </Section>

          <Section title="2. Description of Services">
            TopFloor provides educational content and coaching related to day trading, including live trading sessions, trade alerts, curriculum materials, private Discord community access, and one-on-one mentorship. Access level depends on your membership tier.
          </Section>

          <Section title="3. Not Financial Advice">
            <strong style={{ color: "#f5f5f5" }}>IMPORTANT DISCLAIMER:</strong> All content provided by TopFloor is for <strong style={{ color: "#f5f5f5" }}>educational purposes only</strong>. Nothing on this platform constitutes financial advice, investment advice, or a recommendation to buy or sell any security. Trading involves substantial risk of loss. Past performance demonstrated by Coach Floor or community members is not indicative of future results. You are solely responsible for your own trading decisions.
          </Section>

          <Section title="4. Eligibility">
            You must be at least 18 years old to use our services. By signing up, you confirm that you meet this age requirement and are legally permitted to enter into this agreement in your jurisdiction.
          </Section>

          <Section title="5. Membership and Payments">
            <ul>
              <li>Subscriptions are billed monthly (Bronze, Silver, Gold) or as a one-time payment (Elite Lifetime), as described on the pricing page.</li>
              <li>All payments are processed securely by Stripe.</li>
              <li>Monthly subscriptions auto-renew unless cancelled before the renewal date.</li>
              <li>Lifetime memberships are non-refundable after 7 days.</li>
              <li>Monthly subscriptions may be cancelled at any time; access continues until the end of the current billing period.</li>
            </ul>
          </Section>

          <Section title="6. Refund Policy">
            We offer a 7-day refund window for new monthly subscriptions. After 7 days, no refunds are issued for the current billing period. Lifetime memberships are non-refundable after 7 days from purchase. To request a refund, contact us within the eligible window at noreply@topfloortradesofficial.com.
          </Section>

          <Section title="7. Acceptable Use">
            You agree not to:
            <ul style={{ marginTop: 12 }}>
              <li>Share, resell, or redistribute any course materials, trade alerts, or Discord content.</li>
              <li>Use our content to build competing products or services.</li>
              <li>Impersonate Coach Floor or any TopFloor staff member.</li>
              <li>Engage in harassment, spam, or abusive behavior in community spaces.</li>
              <li>Attempt to circumvent membership access controls.</li>
            </ul>
            Violation of these terms may result in immediate account termination without refund.
          </Section>

          <Section title="8. Intellectual Property">
            All content on TopFloor — including videos, PDFs, trade strategies, branding, and course materials — is the exclusive property of TopFloor. You are granted a limited, non-transferable license to access this content for personal use only during an active membership.
          </Section>

          <Section title="9. Termination">
            We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may cancel your membership at any time through your account settings or by contacting us.
          </Section>

          <Section title="10. Limitation of Liability">
            To the maximum extent permitted by law, TopFloor and its operators shall not be liable for any trading losses, indirect, incidental, or consequential damages arising from your use of our services or reliance on any content provided. Our total liability is limited to the amount you paid for the service in the 30 days preceding the claim.
          </Section>

          <Section title="11. Governing Law">
            These Terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration rather than in court, except where prohibited by law.
          </Section>

          <Section title="12. Contact">
            For questions about these Terms, contact us at:{" "}
            <a href="mailto:noreply@topfloortradesofficial.com" style={{ color: "#00ff88" }}>
              noreply@topfloortradesofficial.com
            </a>
          </Section>
        </div>

        <div style={{ marginTop: 60, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", marginRight: 24 }}>
            Privacy Policy
          </Link>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>{title}</h2>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}
