import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }) }));
vi.mock("@/lib/admin-auth", () => ({ getAdminToken: () => "admin_token_stub" }));

const mockSendDiscordLog = vi.fn();
vi.mock("@/lib/discord", () => ({ sendDiscordLog: (...a: unknown[]) => mockSendDiscordLog(...a) }));

const mockSend = vi.fn();
vi.mock("resend", () => ({ Resend: class { emails = { send: (...a: unknown[]) => mockSend(...a) }; } }));

// existing fetch -> .select().eq().single(); update -> .update().eq().select().single()
let existingBooking: Record<string, unknown> = {};
const chain = {
  select: vi.fn(() => chain),
  update: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  single: vi.fn(),
};
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: { from: () => chain } }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: object) {
  return new Request("https://test.com/api/admin/bookings/book_1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPut(body: object) {
  const { PUT } = await import("@/app/api/admin/bookings/[id]/route");
  return PUT(makeReq(body), { params: Promise.resolve({ id: "book_1" }) });
}

function seedSingle() {
  chain.single
    .mockReset()
    .mockResolvedValueOnce({ data: existingBooking })
    .mockResolvedValueOnce({ data: { id: "book_1", status: "confirmed" }, error: null });
}

function confirmEmbed() {
  const call = mockSendDiscordLog.mock.calls.find(
    (c) => (c[0] as { title?: string }).title?.includes("Confirmed"),
  );
  return call?.[0] as { fields: { name: string; value: string }[]; description?: string } | undefined;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PUT /api/admin/bookings/[id] — confirm -> add-to-calendar link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCookieGet.mockReturnValue({ value: "admin_token_stub" });
    mockSend.mockResolvedValue({});
    existingBooking = {
      status: "pending",
      member_email: "member@test.com",
      member_name: "Navroop Chahal",
      preferred_time: "Mon 9:00 AM",
      call_type: "trade_review",
      zoom_link: null,
      slot_id: "slot_1",
      scheduled_at: "2026-07-20T09:00",
    };
    seedSingle();
  });

  it("returns 401 without the admin cookie", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(401);
  });

  it("adds an Add-to-Google-Calendar link to the confirmed embed when scheduled_at exists", async () => {
    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(200);

    const embed = confirmEmbed();
    expect(embed).toBeDefined();
    const calField = embed!.fields.find((f) => f.name === "Calendar");
    expect(calField).toBeDefined();
    expect(calField!.value).toContain("calendar.google.com/calendar/render");
    // routed to the bookings channel
    expect(mockSendDiscordLog).toHaveBeenCalledWith(expect.anything(), "bookings");
  });

  it("omits the calendar link when there is no scheduled_at", async () => {
    existingBooking.scheduled_at = null;
    seedSingle();

    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(200);

    const embed = confirmEmbed();
    expect(embed).toBeDefined();
    expect(embed!.fields.find((f) => f.name === "Calendar")).toBeUndefined();
  });

  it("still confirms + emails the member regardless of the calendar link", async () => {
    await callPut({ status: "confirmed" });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
