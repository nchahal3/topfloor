import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSendDiscordLog = vi.fn();
vi.mock("@/lib/discord", () => ({ sendDiscordLog: (...a: unknown[]) => mockSendDiscordLog(...a) }));

const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

// bookings insert -> .insert().select().single(); slot claim -> .update().eq().eq().select().single()
const mockInsertSingle = vi.fn();
const bookingsChain = {
  insert: vi.fn(() => bookingsChain),
  select: vi.fn(() => bookingsChain),
  single: vi.fn(() => mockInsertSingle()),
  update: vi.fn(() => bookingsChain),
  eq: vi.fn(() => bookingsChain),
};
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: () => bookingsChain },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: object) {
  return new Request("https://test.com/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPost(body: object) {
  const { POST } = await import("@/app/api/bookings/route");
  return POST(makeReq(body));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCurrentUser.mockResolvedValue({
      firstName: "Navroop",
      lastName: "Chahal",
      emailAddresses: [{ emailAddress: "navroop@test.com" }],
      publicMetadata: { tier: "bronze" },
    });
    mockInsertSingle.mockResolvedValue({ data: { id: "book_1" }, error: null });
  });

  it("returns 401 when not signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await callPost({ call_type: "intro", preferred_time: "Mon 9am" });
    expect(res.status).toBe(401);
    expect(mockSendDiscordLog).not.toHaveBeenCalled();
  });

  it("returns 400 when preferred_time is missing", async () => {
    const res = await callPost({ call_type: "intro" });
    expect(res.status).toBe(400);
    expect(mockSendDiscordLog).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid call type", async () => {
    const res = await callPost({ call_type: "nonsense", preferred_time: "Mon 9am" });
    expect(res.status).toBe(400);
  });

  it("returns 403 for trade_review without a tier", async () => {
    mockCurrentUser.mockResolvedValue({
      firstName: "Free", lastName: "User",
      emailAddresses: [{ emailAddress: "free@test.com" }],
      publicMetadata: {},
    });
    const res = await callPost({ call_type: "trade_review", preferred_time: "Mon 9am" });
    expect(res.status).toBe(403);
  });

  it("creates the booking and posts a New Booking Request to the bookings channel", async () => {
    const res = await callPost({ call_type: "intro", preferred_time: "Mon 9am", topic: "risk mgmt" });
    expect(res.status).toBe(200);

    expect(mockSendDiscordLog).toHaveBeenCalledTimes(1);
    const [embed, channel] = mockSendDiscordLog.mock.calls[0];
    expect(embed.title).toMatch(/New Booking Request/i);
    expect(channel).toBe("bookings");
  });
});
