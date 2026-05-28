import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TopFloor",
  description: "How TopFloor collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  const updated = "May 26, 2025";

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", paddingTop: 96 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>
        <Link href="/" className="display-font text-2xl glow-green-subtle" style={{ color: "#00ff88", textDecoration: "none" }}>
          🔝Floor
        </Link>

        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 48, margin: "32px 0 8px", lineHeight: 1 }}>
          Privacy Policy
        </h1>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 48 }}>Last updated: {updated}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <Section title="1. Introduction">
            TopFloor (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website topfloortradesofficial.com and related services. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information. By using our services, you agree to the collection and use of information in accordance with this policy.
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect information you provide directly:</p>
            <ul>
              <li><strong>Account information</strong> — name, email address, and password when you sign up via Clerk.</li>
              <li><strong>Payment information</strong> — billing details processed securely by Stripe. We never store raw card data.</li>
              <li><strong>Contact form submissions</strong> — name, email, and message content.</li>
              <li><strong>Discord username</strong> — provided optionally during checkout to grant server access.</li>
            </ul>
            <p style={{ marginTop: 12 }}>We also collect automatically:</p>
            <ul>
              <li>IP address, browser type, and pages visited for analytics and security.</li>
              <li>Cookies required for authentication sessions.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>Provide, maintain, and improve our coaching services.</li>
              <li>Process payments and manage your subscription.</li>
              <li>Send transactional emails (welcome, receipts, access confirmations).</li>
              <li>Respond to support and contact form requests.</li>
              <li>Enforce our Terms of Service and prevent fraud.</li>
            </ul>
            We do not sell your personal information to third parties.
          </Section>

          <Section title="4. Third-Party Services">
            We use the following trusted services which may process your data:
            <ul style={{ marginTop: 12 }}>
              <li><strong>Clerk</strong> — authentication and user management.</li>
              <li><strong>Stripe</strong> — payment processing.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Supabase</strong> — database storage.</li>
              <li><strong>Vercel</strong> — website hosting and infrastructure.</li>
            </ul>
            Each of these providers has their own privacy policy governing how they handle your data.
          </Section>

          <Section title="5. Data Retention">
            We retain your account data for as long as your account is active or as needed to provide our services. Payment records are retained as required by law. You may request deletion of your account by contacting us.
          </Section>

          <Section title="6. Your Rights">
            Depending on your location, you may have the right to:
            <ul style={{ marginTop: 12 }}>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Opt out of marketing communications (all our emails include an unsubscribe link).</li>
            </ul>
            To exercise these rights, contact us at{" "}
            <a href="mailto:noreply@topfloortradesofficial.com" style={{ color: "#00ff88" }}>
              noreply@topfloortradesofficial.com
            </a>.
          </Section>

          <Section title="7. Security">
            We implement industry-standard security measures including HTTPS encryption, secure cookie handling, and restricted database access. No method of transmission over the internet is 100% secure, but we take reasonable precautions to protect your information.
          </Section>

          <Section title="8. Children's Privacy">
            Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy on this page with a revised date. Continued use of our services after changes constitutes acceptance.
          </Section>

          <Section title="10. Contact Us">
            If you have questions about this Privacy Policy, contact us at:{" "}
            <a href="mailto:noreply@topfloortradesofficial.com" style={{ color: "#00ff88" }}>
              noreply@topfloortradesofficial.com
            </a>
          </Section>
        </div>

        <div style={{ marginTop: 60, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", marginRight: 24 }}>
            Terms of Service
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
