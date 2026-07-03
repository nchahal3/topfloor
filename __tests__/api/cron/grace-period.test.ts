import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockClerkUser = (overrides = {}) => ({
  publicMetadata: { tier: "gold", discordUserId: "discord_123" },
  ...overrides,
});

const mockClerkInstance = {
  users: {
    getUser: vi.fn(),
    updateUserMetadata: vi.fn(),
  },
};

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue(mockClerkInstance),
}));

const mockRevokeProRole = vi.fn();
vi.mock("@/lib/discord-roles", () => ({
  revokeProRole: mockRevokeProRole,
}));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string) {
  return new Request("https://test.com/api/cron/grace-period", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

async function callRoute(authHeader?: string) {
  const { GET } = await import("@/app/api/cron/grace-period/route");
  return GET(makeRequest(authHeader));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/cron/grace-period", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Default Supabase chain: select returns expired user, delete succeeds
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: [{ clerk_user_id: "user_abc" }], error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockClerkInstance.users.getUser.mockResolvedValue(mockClerkUser());
    mockClerkInstance.users.updateUserMetadata.mockResolvedValue({});
    mockRevokeProRole.mockResolvedValue(undefined);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await callRoute();
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization header has wrong secret", async () => {
    const res = await callRoute("Bearer wrong_secret");
    expect(res.status).toBe(401);
  });

  it("accepts correct CRON_SECRET and processes expired users", async () => {
    const res = await callRoute("Bearer cron_secret_stub");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(1);
    expect(body.errors).toHaveLength(0);
  });

  it("revokes Discord Pro role for locked user", async () => {
    await callRoute("Bearer cron_secret_stub");
    expect(mockRevokeProRole).toHaveBeenCalledWith("discord_123");
  });

  it("sets tier:null, suspendedTier, clears gracePeriodEnd and Discord metadata", async () => {
    await callRoute("Bearer cron_secret_stub");
    expect(mockClerkInstance.users.updateUserMetadata).toHaveBeenCalledWith(
      "user_abc",
      {
        publicMetadata: {
          tier: null,
          suspendedTier: "gold",
          gracePeriodEnd: null,
          discordUserId: null,
          discordUsername: null,
        },
      }
    );
  });

  it("skips lifetime members without revoking access", async () => {
    mockClerkInstance.users.getUser.mockResolvedValue(
      mockClerkUser({ publicMetadata: { tier: "lifetime", discordUserId: "discord_123" } })
    );

    const res = await callRoute("Bearer cron_secret_stub");
    expect(res.status).toBe(200);
    expect(mockRevokeProRole).not.toHaveBeenCalled();
    expect(mockClerkInstance.users.updateUserMetadata).not.toHaveBeenCalled();
  });

  it("returns processed:0 when no expired grace periods exist", async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const res = await callRoute("Bearer cron_secret_stub");
    const body = await res.json();
    expect(body.processed).toBe(0);
  });

  it("returns 500 when Supabase query fails", async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });

    const res = await callRoute("Bearer cron_secret_stub");
    expect(res.status).toBe(500);
  });

  it("records error but continues processing remaining users when one fails", async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({
        data: [{ clerk_user_id: "user_fail" }, { clerk_user_id: "user_ok" }],
        error: null,
      }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockClerkInstance.users.getUser
      .mockRejectedValueOnce(new Error("Clerk unavailable"))
      .mockResolvedValueOnce(mockClerkUser());

    const res = await callRoute("Bearer cron_secret_stub");
    const body = await res.json();
    expect(body.processed).toBe(1);
    expect(body.errors).toHaveLength(1);
  });

  it("does not revoke Discord role when user has no discordUserId", async () => {
    mockClerkInstance.users.getUser.mockResolvedValue(
      mockClerkUser({ publicMetadata: { tier: "gold", discordUserId: undefined } })
    );

    await callRoute("Bearer cron_secret_stub");
    // Route guards revokeProRole with `if (discordUserId)` — skipped when undefined
    expect(mockRevokeProRole).not.toHaveBeenCalled();
  });

  it("deletes grace_periods row after locking so cron does not re-process on next run", async () => {
    // Capture the Supabase chain so we can inspect delete/eq calls
    const deleteMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: [{ clerk_user_id: "user_abc" }], error: null }),
      delete: deleteMock,
      eq: eqMock,
    });

    await callRoute("Bearer cron_secret_stub");

    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("clerk_user_id", "user_abc");
  });
});
