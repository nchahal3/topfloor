import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockUpdateUserMetadata = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: { getUser: mockGetUser, updateUserMetadata: mockUpdateUserMetadata },
  }),
}));

const mockRevokeProRole = vi.fn();
vi.mock("@/lib/discord-roles", () => ({ revokeProRole: mockRevokeProRole }));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: (t: string) => mockSupabaseFrom(t) },
}));

// A chain that serves both the select…maybeSingle read and the delete().eq() write.
// eq returns `this` (fine for the select path); awaiting the chain on the delete path
// harmlessly resolves to the chain itself.
function mockGraceRow(rowData: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: rowData }),
    delete: vi.fn().mockReturnThis(),
  };
  mockSupabaseFrom.mockReturnValue(chain);
  return chain;
}

async function revokeIfGraceExpired(clerkUserId: string) {
  const mod = await import("@/lib/grace-lock");
  return mod.revokeIfGraceExpired(clerkUserId);
}

const PAST = "2020-01-01T00:00:00.000Z";
const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("revokeIfGraceExpired", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockUpdateUserMetadata.mockResolvedValue({});
    mockRevokeProRole.mockResolvedValue(undefined);
  });

  it("returns skipped_paid when no grace row exists (member already recovered)", async () => {
    mockGraceRow(null);
    const result = await revokeIfGraceExpired("user_abc");
    expect(result).toBe("skipped_paid");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns skipped_not_expired when the grace deadline is still in the future", async () => {
    mockGraceRow({ expires_at: FUTURE });
    const result = await revokeIfGraceExpired("user_abc");
    expect(result).toBe("skipped_not_expired");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("locks the member and revokes Discord when the grace period has expired", async () => {
    mockGraceRow({ expires_at: PAST });
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "gold", discordUserId: "discord_123" } });

    const result = await revokeIfGraceExpired("user_abc");

    expect(result).toBe("locked");
    expect(mockRevokeProRole).toHaveBeenCalledWith("discord_123");
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("user_abc", {
      publicMetadata: {
        tier: null,
        suspendedTier: "gold",
        gracePeriodEnd: null,
        discordUserId: null,
        discordUsername: null,
      },
    });
  });

  it("skips lifetime members without revoking access", async () => {
    mockGraceRow({ expires_at: PAST });
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "lifetime", discordUserId: "discord_123" } });

    const result = await revokeIfGraceExpired("user_abc");

    expect(result).toBe("skipped_lifetime");
    expect(mockRevokeProRole).not.toHaveBeenCalled();
    expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
  });

  it("does not revoke Discord when the locked member has no discordUserId", async () => {
    mockGraceRow({ expires_at: PAST });
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "silver" } });

    const result = await revokeIfGraceExpired("user_abc");

    expect(result).toBe("locked");
    expect(mockRevokeProRole).not.toHaveBeenCalled();
    expect(mockUpdateUserMetadata).toHaveBeenCalled();
  });
});
