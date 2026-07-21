import { describe, it, expect } from "vitest";
import { googleCalendarUrl } from "@/lib/calendar-link";

describe("googleCalendarUrl", () => {
  it("builds a well-formed Google Calendar template URL", () => {
    const url = googleCalendarUrl({
      title: "🔝Floor Trade Review - Navroop",
      details: "Trade Review with Navroop Chahal.",
      location: "https://discord.gg/abc",
      startISO: "2026-07-20T14:30:00Z",
      durationMinutes: 30,
    });

    expect(url).toContain("https://calendar.google.com/calendar/render?");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("action")).toBe("TEMPLATE");
    expect(parsed.searchParams.get("text")).toBe("🔝Floor Trade Review - Navroop");
    expect(parsed.searchParams.get("location")).toBe("https://discord.gg/abc");
  });

  it("computes end = start + duration in UTC basic format", () => {
    const url = googleCalendarUrl({
      title: "x",
      details: "y",
      startISO: "2026-07-20T14:30:00Z",
      durationMinutes: 30,
    });
    const dates = new URL(url).searchParams.get("dates");
    // 14:30 + 30min = 15:00
    expect(dates).toBe("20260720T143000Z/20260720T150000Z");
  });

  it("omits location when not provided", () => {
    const url = googleCalendarUrl({
      title: "x", details: "y", startISO: "2026-07-20T14:30:00Z", durationMinutes: 15,
    });
    expect(new URL(url).searchParams.has("location")).toBe(false);
  });

  it("uses a 15-minute window for intro-length calls", () => {
    const url = googleCalendarUrl({
      title: "x", details: "y", startISO: "2026-07-20T09:00:00Z", durationMinutes: 15,
    });
    expect(new URL(url).searchParams.get("dates")).toBe("20260720T090000Z/20260720T091500Z");
  });
});
