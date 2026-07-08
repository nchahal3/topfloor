import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// The route builds: from().select().eq().eq().order().order()  -> resolves to rows.
// Make every builder method return the same thenable chain, so the final await
// yields whatever `queryResult` is set to.
let queryResult: { data: unknown; error: unknown } = { data: [], error: null };

const queryChain: Record<string, unknown> = {};
for (const m of ["select", "eq", "order"]) {
  queryChain[m] = vi.fn(() => Object.assign(Promise.resolve(queryResult), queryChain));
}

const mockCreateSignedUrl = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn(() => queryChain),
    storage: { from: vi.fn(() => ({ createSignedUrl: mockCreateSignedUrl })) },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function callGet() {
  const { GET } = await import("@/app/api/results/route");
  return GET();
}

const baseRow = {
  id: "ach_1",
  member_name: "Navroop Chahal",
  category: "funded_account",
  notes: null as string | null,
  review_quote: null,
  review_role: null,
  file_path: "user/funded/1.png",
  featured_order: null,
  display_label: null as string | null,
  created_at: "2026-07-07T00:00:00Z",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    queryResult = { data: [], error: null };
    // Re-point each builder method at the (possibly new) queryResult
    for (const m of ["select", "eq", "order"]) {
      (queryChain[m] as ReturnType<typeof vi.fn>).mockImplementation(() =>
        Object.assign(Promise.resolve(queryResult), queryChain),
      );
    }
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed.example/img" } });
  });

  it("returns an empty array when nothing is featured", async () => {
    queryResult = { data: [], error: null };
    const res = await callGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 500 when the query errors", async () => {
    queryResult = { data: null, error: { message: "db down" } };
    const res = await callGet();
    expect(res.status).toBe(500);
  });

  it("returns a featured row with a signed image URL", async () => {
    queryResult = { data: [baseRow], error: null };
    const res = await callGet();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].src).toBe("https://signed.example/img");
    expect(body[0].id).toBe("ach_1");
  });

  it("drops rows whose signed URL could not be generated", async () => {
    queryResult = { data: [baseRow], error: null };
    mockCreateSignedUrl.mockResolvedValue({ data: null });
    const res = await callGet();
    expect(await res.json()).toEqual([]);
  });

  it("prefers display_label over notes and the auto label", async () => {
    queryResult = {
      data: [{ ...baseRow, display_label: "Lucid Funded - Teeghan", notes: "some note" }],
      error: null,
    };
    const body = await (await callGet()).json();
    expect(body[0].label).toBe("Lucid Funded - Teeghan");
  });

  it("falls back to notes when there is no display_label", async () => {
    queryResult = { data: [{ ...baseRow, notes: "TopStep 150k pass" }], error: null };
    const body = await (await callGet()).json();
    expect(body[0].label).toBe("TopStep 150k pass");
  });

  it("falls back to an auto label from category + first name", async () => {
    queryResult = { data: [baseRow], error: null };
    const body = await (await callGet()).json();
    expect(body[0].label).toBe("Funded Account - Navroop");
  });
});
