import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPublishJSON = vi.fn();
vi.mock("@upstash/qstash", () => ({
  Client: vi.fn(function () {
    return { publishJSON: mockPublishJSON };
  }),
}));

async function scheduleGraceRevoke(clerkUserId: string) {
  const mod = await import("@/lib/qstash");
  return mod.scheduleGraceRevoke(clerkUserId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("scheduleGraceRevoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockPublishJSON.mockResolvedValue({ messageId: "msg_1" });
    process.env.QSTASH_TOKEN = "qstash_token";
    process.env.QSTASH_URL = "https://qstash-eu-central-1.upstash.io";
    process.env.NEXT_PUBLIC_URL = "https://staging.test";
  });

  it("no-ops when QSTASH_TOKEN is not set (falls back to cron)", async () => {
    delete process.env.QSTASH_TOKEN;
    await scheduleGraceRevoke("user_abc");
    expect(mockPublishJSON).not.toHaveBeenCalled();
  });

  it("no-ops when NEXT_PUBLIC_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_URL;
    await scheduleGraceRevoke("user_abc");
    expect(mockPublishJSON).not.toHaveBeenCalled();
  });

  it("publishes a delayed revoke job with the correct URL, body, and 24h delay", async () => {
    await scheduleGraceRevoke("user_abc");

    expect(mockPublishJSON).toHaveBeenCalledTimes(1);
    expect(mockPublishJSON).toHaveBeenCalledWith({
      url: "https://staging.test/api/revoke-access",
      body: { clerkUserId: "user_abc" },
      delay: 24 * 60 * 60,
    });
  });

  it("never throws when QStash errors (must not break the webhook)", async () => {
    mockPublishJSON.mockRejectedValue(new Error("QStash down"));
    await expect(scheduleGraceRevoke("user_abc")).resolves.toBeUndefined();
  });
});
