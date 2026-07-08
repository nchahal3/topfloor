import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}));

vi.mock("@/lib/admin-auth", () => ({ getAdminToken: () => "admin_token_stub" }));

// One chainable object serves both the read (select/eq/single) used by the
// feature guard and the write (update/eq) used to persist. Track the last
// update payload so tests can assert exactly what was written.
const mockSelectSingle = vi.fn();
let lastUpdatePayload: Record<string, unknown> | null = null;

const chain = {
  select: vi.fn().mockReturnThis(),
  update: vi.fn((payload: Record<string, unknown>) => {
    lastUpdatePayload = payload;
    return chain;
  }),
  eq: vi.fn((..._args: unknown[]) => chain),
  single: vi.fn(() => mockSelectSingle()),
};
// `.eq` terminates the update chain (returns the promise) but continues the
// select chain (returns `chain`). Resolve to the update result by default;
// `.single()` overrides for the read path.
const mockSupabaseFrom = vi.fn((_table: string) => chain);
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: (t: string) => mockSupabaseFrom(t) },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: object) {
  return new Request("https://test.com/api/admin/achievements/ach_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPatch(body: object, id = "ach_1") {
  const { PATCH } = await import("@/app/api/admin/achievements/[id]/route");
  return PATCH(makeReq(body), { params: Promise.resolve({ id }) });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PATCH /api/admin/achievements/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    lastUpdatePayload = null;
    mockCookieGet.mockReturnValue({ value: "admin_token_stub" });
    // Update terminates on .eq -> resolve success; guard read uses .single()
    chain.eq.mockImplementation((..._a: unknown[]) => {
      // When used to terminate an update, the route awaits this. When used in
      // the select chain it is followed by .single(). Returning a thenable that
      // is also `chain` satisfies both: awaiting yields {error:null}, chaining
      // still works.
      return Object.assign(Promise.resolve({ error: null }), chain);
    });
    mockSelectSingle.mockResolvedValue({ data: { status: "approved" } });
  });

  it("returns 401 when the admin cookie is missing/invalid", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const res = await callPatch({ featured: true });
    expect(res.status).toBe(401);
  });

  it("returns 400 when there is nothing to update", async () => {
    const res = await callPatch({ irrelevant: "x" });
    expect(res.status).toBe(400);
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("sets status + admin_notes on review", async () => {
    const res = await callPatch({ status: "approved", admin_notes: "looks good" });
    expect(res.status).toBe(200);
    expect(lastUpdatePayload).toMatchObject({ status: "approved", admin_notes: "looks good" });
  });

  it("auto-unfeatures when status is demoted out of approved", async () => {
    const res = await callPatch({ status: "rejected" });
    expect(res.status).toBe(200);
    expect(lastUpdatePayload).toMatchObject({ status: "rejected", featured: false });
  });

  it("features an already-approved achievement", async () => {
    mockSelectSingle.mockResolvedValue({ data: { status: "approved" } });
    const res = await callPatch({ featured: true });
    expect(res.status).toBe(200);
    expect(lastUpdatePayload).toMatchObject({ featured: true });
  });

  it("refuses to feature an achievement that is not approved", async () => {
    mockSelectSingle.mockResolvedValue({ data: { status: "pending" } });
    const res = await callPatch({ featured: true });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/approved/i);
  });

  it("saves a display_label", async () => {
    const res = await callPatch({ display_label: "Lucid Funded Account - Teeghan" });
    expect(res.status).toBe(200);
    expect(lastUpdatePayload).toMatchObject({ display_label: "Lucid Funded Account - Teeghan" });
  });

  it("clears display_label to null when blank", async () => {
    const res = await callPatch({ display_label: "   " });
    expect(res.status).toBe(200);
    expect(lastUpdatePayload).toMatchObject({ display_label: null });
  });
});
