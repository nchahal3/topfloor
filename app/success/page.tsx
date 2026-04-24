import Link from "next/link";

const PLAN_NAMES: Record<string, string> = {
  foundation: "Foundation",
  elite_monthly: "Elite Mentorship",
  elite_lifetime: "Elite Mentorship Lifetime",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const planName = PLAN_NAMES[plan ?? ""] ?? "🔝Floor";

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-lg w-full text-center">
        <div className="text-6xl mb-6">🎉</div>

        <h1
          className="display-font text-5xl sm:text-6xl text-white mb-4"
        >
          You&apos;re In!
        </h1>

        <p className="text-lg mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
          Welcome to{" "}
          <span style={{ color: "#00ff88" }} className="font-semibold">
            {planName}
          </span>
          .
        </p>

        <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
          Check your email for your receipt. Then join the Discord below to get
          access to everything right away.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://discord.gg/kxnfaPNC"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-8 py-4 text-base"
          >
            Join the Discord →
          </a>
          <Link
            href="/"
            className="btn-outline px-8 py-4 text-base text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
