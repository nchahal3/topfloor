import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Lock, Play, FileText } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { hasAccess, TIER_COLORS, TIER_LABELS } from "@/lib/tier";
import type { Tier } from "@/lib/tier";

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  notes: string | null;
  video_id: string | null;
  pdf_path: string | null;
  order_index: number;
  created_at: string;
  pdf_url?: string | null;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  tier: Tier | null;
  order_index: number;
  created_at: string;
  canAccess: boolean;
  lessons: Lesson[];
};

async function getCurriculumData(tier: Tier): Promise<Module[]> {
  const { data: modules, error: modError } = await supabaseAdmin
    .from("curriculum_modules")
    .select("*")
    .order("order_index", { ascending: true });

  if (modError || !modules) return [];

  const { data: lessons, error: lesError } = await supabaseAdmin
    .from("curriculum_lessons")
    .select("*")
    .order("order_index", { ascending: true });

  if (lesError || !lessons) return [];

  return Promise.all(
    modules.map(async (mod) => {
      const canAccess = hasAccess(tier, mod.tier as Tier);
      const modLessons = lessons.filter((l) => l.module_id === mod.id);

      const lessonsWithUrls: Lesson[] = await Promise.all(
        modLessons.map(async (lesson) => {
          let pdf_url: string | null = null;
          if (canAccess && lesson.pdf_path) {
            const { data } = await supabaseAdmin.storage
              .from("curriculum")
              .createSignedUrl(lesson.pdf_path, 3600);
            pdf_url = data?.signedUrl ?? null;
          }
          return {
            id: lesson.id,
            module_id: lesson.module_id,
            title: lesson.title,
            notes: lesson.notes ?? null,
            video_id: canAccess ? (lesson.video_id ?? null) : null,
            pdf_path: canAccess ? (lesson.pdf_path ?? null) : null,
            pdf_url,
            order_index: lesson.order_index,
            created_at: lesson.created_at,
          };
        })
      );

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description ?? null,
        tier: (mod.tier as Tier) ?? null,
        order_index: mod.order_index,
        created_at: mod.created_at,
        canAccess,
        lessons: lessonsWithUrls,
      };
    })
  );
}

function TierBadge({ tier }: { tier: Tier | null }) {
  if (!tier) return null;
  const color = TIER_COLORS[tier] ?? "#f5f5f5";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        padding: "2px 8px",
        borderRadius: 4,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        flexShrink: 0,
      }}
    >
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

export default async function CurriculumPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;

  // Fetch tier from Clerk metadata (already on currentUser)
  const modules = await getCurriculumData(tier);

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Coaching Content
        </p>
        <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
          Curriculum
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15, maxWidth: 560 }}>
          {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} across {modules.length} module{modules.length !== 1 ? "s" : ""}. Unlock more content by upgrading your membership.
        </p>
      </div>

      {/* Modules */}
      {modules.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>
          No curriculum content yet. Check back soon.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {modules.map((mod) => (
            <div key={mod.id}>
              {/* Module heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ color: mod.canAccess ? "#f5f5f5" : "rgba(255,255,255,0.35)", fontSize: 17, fontWeight: 700, margin: 0, flex: 1 }}>
                  {mod.title}
                </h2>
                <TierBadge tier={mod.tier} />
                {!mod.canAccess && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    <Lock size={11} />
                    {mod.tier ? `${TIER_LABELS[mod.tier]}+ required` : "Upgrade required"}
                  </span>
                )}
              </div>

              {mod.description && (
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
                  {mod.description}
                </p>
              )}

              {/* Lessons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mod.lessons.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0, paddingLeft: 4 }}>No lessons in this module yet.</p>
                ) : (
                  mod.lessons.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} canAccess={mod.canAccess} moduleTier={mod.tier} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade CTA */}
      {!tier && (
        <div
          style={{
            marginTop: 40,
            padding: "28px 32px",
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))",
            border: "1px solid rgba(0,255,136,0.15)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>
            Unlock the full coaching series
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 20px" }}>
            Bronze membership starts at $200/mo. Cancel anytime.
          </p>
          <Link
            href="/pricing"
            style={{
              padding: "12px 32px",
              borderRadius: 999,
              background: "#00ff88",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Lesson Card ──────────────────────────────────────────────────────────────

function LessonCard({
  lesson,
  canAccess,
  moduleTier,
}: {
  lesson: Lesson;
  canAccess: boolean;
  moduleTier: Tier | null;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#111",
        border: `1px solid ${canAccess ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`,
        opacity: canAccess ? 1 : 0.5,
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
        {/* Icon */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: canAccess ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${canAccess ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.05)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {canAccess ? (
            <Play size={13} style={{ color: "#00ff88" }} />
          ) : (
            <Lock size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
          )}
        </div>

        {/* Title + notes */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: canAccess ? "#f5f5f5" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14, margin: 0 }}>
            {lesson.title}
          </p>
          {lesson.notes && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "3px 0 0", lineHeight: 1.4 }}>
              {lesson.notes}
            </p>
          )}
        </div>

        {/* Right side actions / lock */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {canAccess ? (
            <>
              {lesson.pdf_url && (
                <a
                  href={lesson.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(240,192,64,0.08)",
                    border: "1px solid rgba(240,192,64,0.25)",
                    color: "#f0c040",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <FileText size={12} /> PDF
                </a>
              )}
            </>
          ) : (
            <Link
              href="/pricing"
              style={{ fontSize: 11, fontWeight: 700, color: "#00ff88", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              {moduleTier ? `${TIER_LABELS[moduleTier]}+` : "Upgrade"} →
            </Link>
          )}
        </div>
      </div>

      {/* YouTube embed — only if accessible and has video_id */}
      {canAccess && lesson.video_id && (
        <div style={{ padding: "0 20px 20px" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "56.25%",
              borderRadius: 10,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${lesson.video_id}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
