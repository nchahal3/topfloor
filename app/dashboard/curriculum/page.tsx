import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Lock, FileText, Play, BookOpen } from "lucide-react";
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
              .from("Curriculum")
              .createSignedUrl(lesson.pdf_path, 86400);
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

export default async function CurriculumPage() {
  const user = await currentUser();
  const tier = (user?.publicMetadata?.tier as Tier) ?? null;
  const modules = await getCurriculumData(tier);

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const hasLocked = modules.some((m) => !m.canAccess);

  return (
    <>
      <style>{`
        .lesson-row:hover { background: #161616 !important; }
        .lesson-row-link:hover { background: #161616 !important; }
      `}</style>

      <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
            Coaching Content
          </p>
          <h1 className="display-font" style={{ color: "#f5f5f5", fontSize: 42, margin: 0, lineHeight: 1 }}>
            Curriculum
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 15 }}>
            {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} across {modules.length} module{modules.length !== 1 ? "s" : ""}.
            {hasLocked && " Upgrade your plan to unlock more."}
          </p>
        </div>

        {modules.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>
            No curriculum content yet. Check back soon.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {modules.map((mod, modIndex) => {
              const tierColor = mod.tier ? (TIER_COLORS[mod.tier] ?? "#444") : "#444";
              return (
                <div key={mod.id}>
                  {/* Module header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      marginBottom: 16,
                      paddingLeft: 16,
                      borderLeft: `3px solid ${mod.canAccess ? tierColor : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
                          MODULE {String(modIndex + 1).padStart(2, "0")}
                        </span>
                        {!mod.canAccess && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                            <Lock size={10} /> Locked
                          </span>
                        )}
                      </div>
                      <h2 style={{ color: mod.canAccess ? "#f5f5f5" : "rgba(255,255,255,0.3)", fontSize: 18, fontWeight: 700, margin: 0 }}>
                        {mod.title}
                      </h2>
                      {mod.description && (
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "5px 0 0", lineHeight: 1.5 }}>
                          {mod.description}
                        </p>
                      )}
                    </div>

                    {!mod.canAccess && (
                      <Link
                        href="/pricing"
                        style={{
                          flexShrink: 0, fontSize: 12, fontWeight: 700,
                          color: "#00ff88", textDecoration: "none",
                          padding: "7px 14px", borderRadius: 8,
                          border: "1px solid rgba(0,255,136,0.25)",
                          background: "rgba(0,255,136,0.06)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Upgrade →
                      </Link>
                    )}
                  </div>

                  {/* Lessons */}
                  <div style={{ display: "flex", flexDirection: "column", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    {mod.lessons.length === 0 ? (
                      <div style={{ padding: "20px 24px", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                        No lessons yet.
                      </div>
                    ) : (
                      mod.lessons.map((lesson, i) => {
                        const hasPdf = !!lesson.pdf_url;
                        const hasVideo = !!lesson.video_id;
                        const isLast = i === mod.lessons.length - 1;

                        const innerContent = (
                          <>
                            {/* Number */}
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: mod.canAccess ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700,
                              color: mod.canAccess ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                            }}>
                              {String(i + 1).padStart(2, "0")}
                            </div>

                            {/* Icon */}
                            <div style={{
                              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                              background: mod.canAccess ? (hasPdf ? "rgba(240,192,64,0.08)" : hasVideo ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.04)") : "rgba(255,255,255,0.03)",
                              border: `1px solid ${mod.canAccess ? (hasPdf ? "rgba(240,192,64,0.2)" : hasVideo ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.06)") : "rgba(255,255,255,0.04)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {!mod.canAccess ? (
                                <Lock size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                              ) : hasPdf && !hasVideo ? (
                                <FileText size={13} style={{ color: "#f0c040" }} />
                              ) : hasVideo && !hasPdf ? (
                                <Play size={13} style={{ color: "#00ff88" }} />
                              ) : (hasPdf || hasVideo) ? (
                                <BookOpen size={13} style={{ color: "#00ff88" }} />
                              ) : (
                                <FileText size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
                              )}
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                color: mod.canAccess ? "#f5f5f5" : "rgba(255,255,255,0.3)",
                                fontWeight: 600, fontSize: 14, margin: 0,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>
                                {lesson.title}
                              </p>
                              {lesson.notes && (
                                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "3px 0 0", lineHeight: 1.4 }}>
                                  {lesson.notes}
                                </p>
                              )}
                            </div>

                            {/* Right action */}
                            <div style={{ flexShrink: 0 }}>
                              {mod.canAccess ? (
                                hasPdf ? (
                                  <span style={{
                                    fontSize: 12, fontWeight: 600, color: "#f0c040",
                                    display: "flex", alignItems: "center", gap: 4,
                                  }}>
                                    Open PDF →
                                  </span>
                                ) : hasVideo ? (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#00ff88" }}>
                                    Watch →
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Coming soon</span>
                                )
                              ) : (
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Lock size={10} />
                                  {mod.tier ? `${TIER_LABELS[mod.tier]}+` : "Upgrade"}
                                </span>
                              )}
                            </div>
                          </>
                        );

                        const rowStyle: React.CSSProperties = {
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "14px 20px",
                          background: "#111",
                          borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                          transition: "background 0.15s",
                          cursor: mod.canAccess && hasPdf ? "pointer" : "default",
                          textDecoration: "none",
                        };

                        if (mod.canAccess && hasPdf && lesson.pdf_url) {
                          return (
                            <a
                              key={lesson.id}
                              href={lesson.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="lesson-row-link"
                              style={rowStyle}
                            >
                              {innerContent}
                            </a>
                          );
                        }

                        return (
                          <div key={lesson.id} className="lesson-row" style={rowStyle}>
                            {innerContent}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Video embed if lesson has video */}
                  {mod.canAccess && mod.lessons.some((l) => l.video_id) && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                      {mod.lessons.filter((l) => l.video_id).map((lesson) => (
                        <div key={`video-${lesson.id}`}>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 }}>{lesson.title}</p>
                          <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000" }}>
                            <iframe
                              src={lesson.video_id!.startsWith("https://") ? lesson.video_id! : `https://www.youtube.com/embed/${lesson.video_id}`}
                              title={lesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upgrade CTA */}
        {!tier && (
          <div style={{
            marginTop: 48, padding: "28px 32px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))",
            border: "1px solid rgba(0,255,136,0.15)", textAlign: "center",
          }}>
            <p style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>
              Unlock the full coaching series
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 20px" }}>
              Bronze membership starts at $200/mo. Cancel anytime.
            </p>
            <Link href="/pricing" style={{ padding: "12px 32px", borderRadius: 999, background: "#00ff88", color: "#000", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
              View Plans
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
