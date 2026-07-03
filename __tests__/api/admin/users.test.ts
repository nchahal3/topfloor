import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}));

vi.mock("@/lib/admin-auth", () => ({ getAdminToken: () => "admin_token_stub" }));

const mockGetUserList = vi.fn();
const mockDeleteUser = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: { getUserList: mockGetUserList, deleteUser: mockDeleteUser },
  }),
}));

const mockCustomersList = vi.fn();
const mockSubsList = vi.fn();
const mockSubsCancel = vi.fn();
const mockStripeInstance = {
  customers: { list: mockCustomersList },
  subscriptions: { list: mockSubsList, cancel: mockSubsCancel },
};
vi.mock("stripe", () => ({ default: vi.fn(function () { return mockStripeInstance; }) }));

const mockRevokeProRole = vi.fn();
vi.mock("@/lib/discord-roles", () => ({ revokeProRole: mockRevokeProRole }));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: (t: string) => mockSupabaseFrom(t) },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: object) {
  return new Request("https://test.com/api/admin/users", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callDelete(body: object) {
  const { DELETE } = await import("@/app/api/admin/users/route");
  return DELETE(makeReq(body));
}

function mockSupabaseChain() {
  const chain = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
  };
  mockSupabaseFrom.mockReturnValue(chain);
  return chain;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DELETE /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCookieGet.mockReturnValue({ value: "admin_token_stub" });
    mockSupabaseChain();
    mockGetUserList.mockResolvedValue({ data: [{ id: "user_1", publicMetadata: {} }] });
    mockDeleteUser.mockResolvedValue({});
    mockRevokeProRole.mockResolvedValue(undefined);
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_1" }] });
    mockSubsList.mockResolvedValue({ data: [{ id: "sub_1", status: "active" }] });
    mockSubsCancel.mockResolvedValue({});
  });

  it("returns 401 when the admin cookie is missing/invalid", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const res = await callDelete({ email: "m@test.com" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when email is missing", async () => {
    const res = await callDelete({});
    expect(res.status).toBe(400);
  });

  it("deletes the Clerk account, cancels subscriptions, and blocklists the email", async () => {
    const chain = mockSupabaseChain();
    const res = await callDelete({ email: "M@Test.com" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, clerkDeleted: true, subsCancelled: 1 });

    expect(mockDeleteUser).toHaveBeenCalledWith("user_1");
    expect(mockSubsCancel).toHaveBeenCalledWith("sub_1");
    expect(mockSupabaseFrom).toHaveBeenCalledWith("deleted_members");
    // email stored lowercase
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "m@test.com" }),
    );
  });

  it("revokes the Discord role before deleting when the member has one linked", async () => {
    mockGetUserList.mockResolvedValue({
      data: [{ id: "user_1", publicMetadata: { discordUserId: "discord_123" } }],
    });
    await callDelete({ email: "m@test.com" });
    expect(mockRevokeProRole).toHaveBeenCalledWith("discord_123");
  });

  it("still cancels subs + blocklists when the member has no Clerk account in this env", async () => {
    mockGetUserList.mockResolvedValue({ data: [] });
    const chain = mockSupabaseChain();

    const res = await callDelete({ email: "stripe-only@test.com" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ clerkDeleted: false, subsCancelled: 1 });
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(mockSubsCancel).toHaveBeenCalledWith("sub_1");
    expect(chain.upsert).toHaveBeenCalled();
  });

  it("cancels only live subscriptions, skipping canceled/incomplete_expired", async () => {
    mockSubsList.mockResolvedValue({
      data: [
        { id: "s_canceled", status: "canceled" },
        { id: "s_active", status: "active" },
        { id: "s_dead", status: "incomplete_expired" },
        { id: "s_pastdue", status: "past_due" },
      ],
    });

    const res = await callDelete({ email: "m@test.com" });
    const body = await res.json();

    expect(body.subsCancelled).toBe(2);
    expect(mockSubsCancel).toHaveBeenCalledWith("s_active");
    expect(mockSubsCancel).toHaveBeenCalledWith("s_pastdue");
    expect(mockSubsCancel).not.toHaveBeenCalledWith("s_canceled");
    expect(mockSubsCancel).not.toHaveBeenCalledWith("s_dead");
  });

  it("surfaces a non-404 Clerk error as a 500 with detail", async () => {
    mockDeleteUser.mockRejectedValue({ status: 500, errors: [{ message: "Clerk exploded" }] });
    const res = await callDelete({ email: "m@test.com" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Clerk exploded/);
  });
});
