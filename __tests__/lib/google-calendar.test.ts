import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockJWT = vi.fn();

vi.mock("googleapis", () => ({
  google: {
    auth: { JWT: class { constructor(...a: unknown[]) { mockJWT(...a); } } },
    calendar: () => ({ events: { insert: (...a: unknown[]) => mockInsert(...a) } }),
  },
}));

async function importFresh() {
  return import("@/lib/google-calendar");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("createCalendarEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // setup.ts already sets valid stub Google env vars
    mockInsert.mockResolvedValue({ data: { id: "evt_1", htmlLink: "https://cal/evt_1" } });
  });

  it("returns null when required env vars are missing", async () => {
    delete process.env.GOOGLE_CALENDAR_ID;
    const { createCalendarEvent } = await importFresh();
    const result = await createCalendarEvent({
      summary: "x", description: "y", startISO: "2026-07-20T14:30", durationMinutes: 30,
    });
    expect(result).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
    // restore for other tests
    process.env.GOOGLE_CALENDAR_ID = "topfloor@topfloortradesofficial.com";
  });

  it("inserts an event with a correctly computed end time and returns id + link", async () => {
    const { createCalendarEvent } = await importFresh();
    const result = await createCalendarEvent({
      summary: "🔝Floor Trade Review - Navroop",
      description: "desc",
      startISO: "2026-07-20T14:30",
      durationMinutes: 30,
      attendeeEmail: "member@test.com",
      location: "https://discord.gg/x",
    });

    expect(result).toEqual({ id: "evt_1", htmlLink: "https://cal/evt_1" });
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const arg = mockInsert.mock.calls[0][0];
    const start = new Date(arg.requestBody.start.dateTime).getTime();
    const end = new Date(arg.requestBody.end.dateTime).getTime();
    expect(end - start).toBe(30 * 60_000);
    expect(arg.requestBody.attendees).toEqual([{ email: "member@test.com" }]);
    expect(arg.sendUpdates).toBe("all");
  });

  it("returns null (fail-soft) when the API throws", async () => {
    mockInsert.mockRejectedValue(new Error("google down"));
    const { createCalendarEvent } = await importFresh();
    const result = await createCalendarEvent({
      summary: "x", description: "y", startISO: "2026-07-20T14:30", durationMinutes: 15,
    });
    expect(result).toBeNull();
  });

  it("returns null for an invalid startISO", async () => {
    const { createCalendarEvent } = await importFresh();
    const result = await createCalendarEvent({
      summary: "x", description: "y", startISO: "not-a-date", durationMinutes: 15,
    });
    expect(result).toBeNull();
  });
});
