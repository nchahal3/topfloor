import { supabaseAdmin } from "@/lib/supabase";
import { Trophy } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  evaluation_pass: "Evaluation Pass",
  payout_request: "Payout Request",
  account_milestone: "Account Milestone",
  funded_account: "Funded Account",
};

const AVATAR_COLORS = ["#1a4f3a", "#1a2f5a", "#3a1a4f", "#4f3a1a", "#2a3f1a", "#4f1a2a"];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function StudentWins() {
  const { data: wins } = await supabaseAdmin
    .from("achievements")
    .select("id, member_name, category, notes, review_quote, review_role, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!wins || wins.length === 0) return null;

  const withQuote = wins.filter((w) => w.review_quote);
  const proofCards = wins;

  return (
    <section style={{ padding: "80px 0", background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Quote / Review Cards (matching Testimonials style) ── */}
        {withQuote.length > 0 && (
          <div style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#00ff88" }}>
                From the Community
              </p>
              <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
                What Members Say
              </h2>
              <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
                Verified results, in their own words.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {withQuote.map((w, i) => {
                const firstName = w.member_name?.split(" ")[0] ?? "Member";
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div
                    key={w.id}
                    className="rounded-2xl p-7 border flex flex-col gap-4"
                    style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} style={{ color: "#f0c040", fontSize: 14 }}>★</span>
                      ))}
                    </div>

                    <p className="display-font text-6xl leading-none -mt-2 -mb-2" style={{ color: "rgba(0,255,136,0.25)" }}>
                      &ldquo;
                    </p>

                    <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                      {w.review_quote}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: avatarColor }}
                        >
                          {initials(w.member_name ?? firstName)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{firstName}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {w.review_role ?? "🔝Floor Member"}
                          </p>
                        </div>
                      </div>
                      <div
                        className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}
                      >
                        {CATEGORY_LABELS[w.category] ?? w.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Verified Win Proof Cards ── */}
        <div>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#00ff88" }}>
              Verified by Coach Floor
            </p>
            <h2 className="display-font text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">
              Student Wins
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Real proof. Every win below has been reviewed and approved.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {proofCards.map((w, i) => {
              const firstName = w.member_name?.split(" ")[0] ?? "Member";
              const categoryLabel = CATEGORY_LABELS[w.category] ?? w.category;
              return (
                <div
                  key={`proof-${w.id}`}
                  style={{ padding: "20px", borderRadius: 16, background: "#111", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trophy size={14} style={{ color: "#f0c040" }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", padding: "3px 9px", borderRadius: 4, letterSpacing: "0.05em" }}>
                      {categoryLabel.toUpperCase()}
                    </span>
                  </div>

                  {w.notes && (
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.55, margin: 0, flex: 1 }}>
                      {w.notes}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 13, margin: 0 }}>{firstName}</p>
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>
                      {new Date(w.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs mt-10" style={{ color: "rgba(255,255,255,0.25)" }}>
            Individual results vary. Past performance does not guarantee future results. Trading involves risk.
          </p>
        </div>
      </div>
    </section>
  );
}
