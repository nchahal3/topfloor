import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRevokeIfGraceExpired = vi.fn();
vi.mock("@/lib/grace-lock", () => ({
  revokeIfGraceExpired: mockRevokeIfGraceExpired,
}));

const mockVerify = vi.fn();
vi.mock("@upstash/qstash", () => ({
  Receiver: vi.fn(function () {
    return { verify: mockVerify };
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("https://test.com/api/revoke-access", {
    method: "POST",
    headers,
    body,
  });
}

async function callRoute(body: string, headers?: Record<string, string>) {
  const { POST } = await import("@/app/api/revoke-access/route");
  return POST(makeRequest(body, headers));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/revoke-access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockRevokeIfGraceExpired.mockResolvedValue("locked");
    process.env.QSTASH_CURRENT_SIGNING_KEY = "sig_current";
    process.env.QSTASH_NEXT_SIGNING_KEY = "sig_next";
  });

  it("returns 401 with no auth header and no signature", async () => {
    const res = await callRoute(JSON.stringify({ clerkUserId: "user_abc" }));
    expect(res.status).toBe(401);
    expect(mockRevokeIfGraceExpired).not.toHaveBeenCalled();
  });

  it("accepts CRON_SECRET bearer auth and delegates to revokeIfGraceExpired", async () => {
    const res = await callRoute(JSON.stringify({ clerkUserId: "user_abc" }), {
      authorization: "Bearer cron_secret_stub",
    });
    expect(res.status).toBe(200);
    expect(mockRevokeIfGraceExpired).toHaveBeenCalledWith("user_abc");
  });

  it("returns 400 when clerkUserId is missing", async () => {
    const res = await callRoute(JSON.stringify({}), { authorization: "Bearer cron_secret_stub" });
    expect(res.status).toBe(400);
    expect(mockRevokeIfGraceExpired).not.toHaveBeenCalled();
  });

  it("accepts a valid QStash signature", async () => {
    mockVerify.mockResolvedValue(true);
    const res = await callRoute(JSON.stringify({ clerkUserId: "user_abc" }), {
      "upstash-signature": "valid_sig",
    });
    expect(res.status).toBe(200);
    expect(mockRevokeIfGraceExpired).toHaveBeenCalledWith("user_abc");
  });

  it("rejects an invalid QStash signature", async () => {
    mockVerify.mockResolvedValue(false);
    const res = await callRoute(JSON.stringify({ clerkUserId: "user_abc" }), {
      "upstash-signature": "bad_sig",
    });
    expect(res.status).toBe(401);
    expect(mockRevokeIfGraceExpired).not.toHaveBeenCalled();
  });

  it("rejects when signature verification throws", async () => {
    mockVerify.mockRejectedValue(new Error("SignatureError"));
    const res = await callRoute(JSON.stringify({ clerkUserId: "user_abc" }), {
      "upstash-signature": "bad_sig",
    });
    expect(res.status).toBe(401);
  });

  it("returns the lock result in the response body", async () => {
    mockRevokeIfGraceExpired.mockResolvedValue("skipped_paid");
    const res = await callRoute(JSON.stringify({ clerkUserId: "user_abc" }), {
      authorization: "Bearer cron_secret_stub",
    });
    const body = await res.json();
    expect(body.result).toBe("skipped_paid");
  });
});
