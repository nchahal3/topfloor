import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }) }));
vi.mock("@/lib/admin-auth", () => ({ getAdminToken: () => "admin_token_stub" }));

const mockSendDiscordLog = vi.fn();
vi.mock("@/lib/discord", () => ({ sendDiscordLog: (...a: unknown[]) => mockSendDiscordLog(...a) }));

const mockCreateCalendarEvent = vi.fn();
vi.mock("@/lib/google-calendar", () => ({
  createCalendarEvent: (...a: unknown[]) => mockCreateCalendarEvent(...a),
}));

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PUT /api/admin/bookings/[id] — confirm -> calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCookieGet.mockReturnValue({ value: "admin_token_stub" });
    mockSend.mockResolvedValue({});
    mockCreateCalendarEvent.mockResolvedValue({ id: "evt_1", htmlLink: "https://cal/1" });
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
    // .single() is called twice: first for `existing`, then for the updated row
    chain.single
      .mockResolvedValueOnce({ data: existingBooking })
      .mockResolvedValueOnce({ data: { id: "book_1", status: "confirmed" }, error: null });
  });

  it("returns 401 without the admin cookie", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(401);
  });

  it("creates a calendar event with correct duration + attendee when confirmed with a scheduled_at", async () => {
    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(200);

    expect(mockCreateCalendarEvent).toHaveBeenCalledTimes(1);
    const arg = mockCreateCalendarEvent.mock.calls[0][0];
    expect(arg.durationMinutes).toBe(30); // trade_review
    expect(arg.startISO).toBe("2026-07-20T09:00");
    expect(arg.attendeeEmail).toBe("member@test.com");
    expect(arg.location).toContain("discord");
    // confirm log routed to bookings channel
    expect(mockSendDiscordLog).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/Confirmed/i) }),
      "bookings",
    );
  });

  it("does NOT create a calendar event when there is no scheduled_at", async () => {
    existingBooking.scheduled_at = null;
    chain.single
      .mockReset()
      .mockResolvedValueOnce({ data: existingBooking })
      .mockResolvedValueOnce({ data: { id: "book_1", status: "confirmed" }, error: null });

    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(200);
    expect(mockCreateCalendarEvent).not.toHaveBeenCalled();
  });

  it("still succeeds if the calendar helper throws (fail-soft)", async () => {
    mockCreateCalendarEvent.mockRejectedValue(new Error("boom"));
    const res = await callPut({ status: "confirmed" });
    expect(res.status).toBe(200);
  });

  it("uses 15-minute duration for an intro call", async () => {
    existingBooking.call_type = "intro";
    chain.single
      .mockReset()
      .mockResolvedValueOnce({ data: existingBooking })
      .mockResolvedValueOnce({ data: { id: "book_1", status: "confirmed" }, error: null });

    await callPut({ status: "confirmed" });
    expect(mockCreateCalendarEvent.mock.calls[0][0].durationMinutes).toBe(15);
  });
});
