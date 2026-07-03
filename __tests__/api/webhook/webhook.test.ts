import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();
const mockStripeInstance = {
  webhooks: { constructEvent: mockConstructEvent },
  checkout: { sessions: { listLineItems: vi.fn() } },
  customers: { retrieve: vi.fn() },
  subscriptions: { retrieve: vi.fn(), list: vi.fn(), cancel: vi.fn() },
  invoices: { retrieve: vi.fn() },
};
vi.mock("stripe", () => ({ default: vi.fn(function () { return mockStripeInstance; }) }));

const mockUpdateUserMetadata = vi.fn();
const mockGetUser = vi.fn();
const mockGetUserList = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: mockGetUser,
      updateUserMetadata: mockUpdateUserMetadata,
      getUserList: mockGetUserList,
    },
  }),
}));

const mockGrantProRole = vi.fn();
const mockRevokeProRole = vi.fn();
vi.mock("@/lib/discord-roles", () => ({
  grantProRole: mockGrantProRole,
  revokeProRole: mockRevokeProRole,
}));

vi.mock("@/lib/discord", () => ({ sendDiscordLog: vi.fn() }));

const mockResendSend = vi.fn().mockResolvedValue({ id: "email_ok" });
vi.mock("resend", () => ({ Resend: vi.fn(function () { return { emails: { send: mockResendSend } }; }) }));

const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: (t: string) => mockSupabaseFrom(t) },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWebhookRequest(eventType: string, data: object) {
  const event = { type: eventType, data: { object: data } };
  mockConstructEvent.mockReturnValue(event);
  return new Request("https://test.com/api/webhook", {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body: JSON.stringify(event),
  });
}

async function callWebhook(eventType: string, data: object) {
  const { POST } = await import("@/app/api/webhook/route");
  return POST(makeWebhookRequest(eventType, data));
}

function mockSupabaseChain() {
  const chain = {
    upsert: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({}),
  };
  mockSupabaseFrom.mockReturnValue(chain);
  return chain;
}

// ── invoice.payment_failed ────────────────────────────────────────────────────

describe("webhook: invoice.payment_failed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseChain();
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "gold" } });
    mockGetUserList.mockResolvedValue({ data: [{ id: "user_abc" }] });
    mockUpdateUserMetadata.mockResolvedValue({});
    mockResendSend.mockResolvedValue({ id: "ok" });
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
      metadata: { clerkUserId: "user_abc" },
    });
  });

  it("sets gracePeriodEnd 24 hours from now in Clerk", async () => {
    const before = Date.now();
    await callWebhook("invoice.payment_failed", {
      customer_email: "member@test.com",
      customer_name: "Test Member",
      attempt_count: 1,
      subscription: "sub_123",
      lines: { data: [{ price: { id: "price_1Tiiku8sHKVNeGWtthSeTog0" } }] },
    });
    const after = Date.now();

    const call = mockUpdateUserMetadata.mock.calls[0];
    const gracePeriodEnd = new Date(call[1].publicMetadata.gracePeriodEnd).getTime();
    const expectedMin = before + 24 * 60 * 60 * 1000;
    const expectedMax = after + 24 * 60 * 60 * 1000;

    expect(gracePeriodEnd).toBeGreaterThanOrEqual(expectedMin);
    expect(gracePeriodEnd).toBeLessThanOrEqual(expectedMax);
  });

  it("does NOT set grace period for lifetime members", async () => {
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "lifetime" } });

    await callWebhook("invoice.payment_failed", {
      customer_email: "member@test.com",
      subscription: "sub_123",
      lines: { data: [] },
    });

    expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
  });

  it("falls back to email lookup when subscription has no clerkUserId metadata", async () => {
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue({ metadata: {} });

    await callWebhook("invoice.payment_failed", {
      customer_email: "member@test.com",
      subscription: "sub_123",
      lines: { data: [] },
    });

    expect(mockGetUserList).toHaveBeenCalledWith({
      emailAddress: ["member@test.com"],
    });
  });

  it("sends payment failed email to member", async () => {
    await callWebhook("invoice.payment_failed", {
      customer_email: "member@test.com",
      customer_name: "Test Member",
      attempt_count: 1,
      subscription: "sub_123",
      lines: { data: [] },
    });

    const emailCalls = mockResendSend.mock.calls;
    const memberEmail = emailCalls.find((c) => c[0].to === "member@test.com");
    expect(memberEmail).toBeDefined();
    expect(memberEmail![0].subject).toMatch(/payment failed/i);
  });

  it("returns 200 even if Clerk lookup fails (graceful degradation)", async () => {
    mockStripeInstance.subscriptions.retrieve.mockRejectedValue(new Error("Stripe error"));
    mockGetUserList.mockResolvedValue({ data: [] });

    const res = await callWebhook("invoice.payment_failed", {
      customer_email: "member@test.com",
      subscription: "sub_123",
      lines: { data: [] },
    });

    expect(res.status).toBe(200);
  });

  it("upserts grace_periods row in Supabase so cron can find the user", async () => {
    const chain = mockSupabaseChain();

    await callWebhook("invoice.payment_failed", {
      customer_email: "member@test.com",
      subscription: "sub_123",
      lines: { data: [] },
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith("grace_periods");
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ clerk_user_id: "user_abc" })
    );
  });
});

// ── invoice.paid ──────────────────────────────────────────────────────────────

describe("webhook: invoice.paid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseChain();
    mockResendSend.mockResolvedValue({ id: "ok" });
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
      metadata: { clerkUserId: "user_abc" },
    });
    mockGrantProRole.mockResolvedValue(undefined);
    mockUpdateUserMetadata.mockResolvedValue({});
  });

  it("restores tier from suspendedTier and grants Discord role when cron already locked", async () => {
    mockGetUser
      .mockResolvedValueOnce({
        publicMetadata: { tier: null, suspendedTier: "gold", discordUserId: "discord_123" },
      })
      .mockResolvedValueOnce({
        publicMetadata: { tier: "gold", discordUserId: "discord_123" },
      });

    await callWebhook("invoice.paid", {
      billing_reason: "subscription_cycle",
      customer_email: "member@test.com",
      customer_name: "Test Member",
      subscription: "sub_123",
    });

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith(
      "user_abc",
      expect.objectContaining({
        publicMetadata: expect.objectContaining({
          tier: "gold",
          suspendedTier: null,
          gracePeriodEnd: null,
        }),
      })
    );
    expect(mockGrantProRole).toHaveBeenCalledWith("discord_123");
  });

  it("clears gracePeriodEnd when member paid within grace window (tier was never suspended)", async () => {
    mockGetUser.mockResolvedValue({
      publicMetadata: {
        tier: "gold",
        suspendedTier: null,
        gracePeriodEnd: new Date(Date.now() + 60000).toISOString(),
      },
    });

    await callWebhook("invoice.paid", {
      billing_reason: "subscription_cycle",
      subscription: "sub_123",
    });

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith(
      "user_abc",
      expect.objectContaining({
        publicMetadata: expect.objectContaining({ gracePeriodEnd: null }),
      })
    );
    expect(mockGrantProRole).not.toHaveBeenCalled();
  });

  it("does nothing when invoice is not subscription-related", async () => {
    mockGetUser.mockResolvedValue({ publicMetadata: {} });

    await callWebhook("invoice.paid", {
      billing_reason: "manual",
      subscription: null,
    });

    expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
  });

  it("handles manual retry (subscription field present but billing_reason=manual)", async () => {
    mockGetUser.mockResolvedValueOnce({
      publicMetadata: { tier: null, suspendedTier: "silver", discordUserId: null },
    });
    mockGetUser.mockResolvedValueOnce({
      publicMetadata: { tier: "silver", discordUserId: null },
    });

    await callWebhook("invoice.paid", {
      billing_reason: "manual",
      subscription: "sub_manual",
    });

    expect(mockUpdateUserMetadata).toHaveBeenCalled();
  });

  it("deletes grace_periods row in Supabase after restoring access", async () => {
    const chain = mockSupabaseChain();
    mockGetUser
      .mockResolvedValueOnce({
        publicMetadata: { tier: null, suspendedTier: "gold", discordUserId: null },
      })
      .mockResolvedValueOnce({
        publicMetadata: { tier: "gold", discordUserId: null },
      });

    await callWebhook("invoice.paid", {
      billing_reason: "subscription_cycle",
      subscription: "sub_123",
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith("grace_periods");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("clerk_user_id", "user_abc");
  });
});

// ── customer.subscription.deleted ────────────────────────────────────────────

describe("webhook: customer.subscription.deleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseChain();
    mockResendSend.mockResolvedValue({ id: "ok" });
    mockStripeInstance.customers.retrieve.mockResolvedValue({
      email: "member@test.com",
      name: "Test Member",
    });
    mockGetUser.mockResolvedValue({
      publicMetadata: { tier: "gold", discordUserId: "discord_123" },
    });
    mockUpdateUserMetadata.mockResolvedValue({});
    mockRevokeProRole.mockResolvedValue(undefined);
  });

  it("sets tier to null, clears all recovery state, and revokes Discord role", async () => {
    await callWebhook("customer.subscription.deleted", {
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_123",
      items: { data: [{ price: { id: "price_1Tiiku8sHKVNeGWtthSeTog0" } }] },
    });

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith(
      "user_abc",
      expect.objectContaining({
        publicMetadata: expect.objectContaining({
          tier: null,
          suspendedTier: null,
          gracePeriodEnd: null,
          discordUserId: null,
          discordUsername: null,
        }),
      })
    );
    expect(mockRevokeProRole).toHaveBeenCalledWith("discord_123");
  });

  it("deletes grace_periods row on cancellation so cron stops processing the user", async () => {
    const chain = mockSupabaseChain();

    await callWebhook("customer.subscription.deleted", {
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_123",
      items: { data: [] },
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith("grace_periods");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("clerk_user_id", "user_abc");
  });

  it("does NOT revoke lifetime members", async () => {
    mockGetUser.mockResolvedValue({
      publicMetadata: { tier: "lifetime", discordUserId: "discord_123" },
    });

    await callWebhook("customer.subscription.deleted", {
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_123",
      items: { data: [] },
    });

    expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
    expect(mockRevokeProRole).not.toHaveBeenCalled();
  });

  it("falls back to email lookup when clerkUserId not in subscription metadata", async () => {
    mockGetUserList.mockResolvedValue({ data: [{ id: "user_by_email" }] });
    mockGetUser.mockResolvedValue({
      publicMetadata: { tier: "bronze", discordUserId: null },
    });

    await callWebhook("customer.subscription.deleted", {
      metadata: {},
      customer: "cus_123",
      items: { data: [] },
    });

    expect(mockGetUserList).toHaveBeenCalledWith({
      emailAddress: ["member@test.com"],
    });
  });

  it("sends cancellation emails to member and coach", async () => {
    await callWebhook("customer.subscription.deleted", {
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_123",
      items: { data: [] },
    });

    const emailTos = mockResendSend.mock.calls.map((c) => c[0].to);
    expect(emailTos).toContain("member@test.com");
    expect(emailTos).toContain("coach@test.com");
  });
});

// ── checkout.session.completed ────────────────────────────────────────────────

describe("webhook: checkout.session.completed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseChain();
    mockResendSend.mockResolvedValue({ id: "ok" });
    mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValue({
      data: [{ price: { id: "price_1Tiiku8sHKVNeGWtthSeTog0" } }], // gold test price
    });
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: null } });
    mockUpdateUserMetadata.mockResolvedValue({});
    mockGrantProRole.mockResolvedValue(undefined);
    mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
  });

  it("sets tier and stripeCustomerId in Clerk metadata", async () => {
    await callWebhook("checkout.session.completed", {
      id: "cs_test",
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_new",
      customer_details: { email: "new@test.com", name: "New Member", phone: "+15551234567" },
      custom_fields: [],
    });

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith(
      "user_abc",
      expect.objectContaining({
        publicMetadata: expect.objectContaining({
          tier: "gold",
          stripeCustomerId: "cus_new",
          suspendedTier: null,
          gracePeriodEnd: null,
        }),
      })
    );
  });

  it("grants Discord Pro role on checkout", async () => {
    // First getUser: no tier yet (so code doesn't skip as alreadyProcessed)
    // Second getUser (after update): discord linked
    mockGetUser
      .mockResolvedValueOnce({ publicMetadata: { tier: null } })
      .mockResolvedValueOnce({ publicMetadata: { tier: "gold", discordUserId: "discord_abc" } });

    await callWebhook("checkout.session.completed", {
      id: "cs_test",
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_new",
      customer_details: { email: "new@test.com", name: "New Member" },
      custom_fields: [],
    });

    expect(mockGrantProRole).toHaveBeenCalledWith("discord_abc");
  });

  it("sends welcome email to member", async () => {
    await callWebhook("checkout.session.completed", {
      id: "cs_test",
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_new",
      customer_details: { email: "new@test.com", name: "New Member" },
      custom_fields: [],
    });

    const emailTos = mockResendSend.mock.calls.map((c) => c[0].to);
    expect(emailTos).toContain("new@test.com");
  });

  it("skips duplicate processing when tier already matches", async () => {
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "gold" } });

    const res = await callWebhook("checkout.session.completed", {
      id: "cs_test",
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_existing",
      customer_details: { email: "existing@test.com", name: "Existing" },
      custom_fields: [],
    });

    expect(res.status).toBe(200);
    // Should not update metadata again or send emails
    expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("returns 200 and logs error when Clerk update fails (does not throw)", async () => {
    mockUpdateUserMetadata.mockRejectedValue(new Error("Clerk down"));

    const res = await callWebhook("checkout.session.completed", {
      id: "cs_test",
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_new",
      customer_details: { email: "new@test.com", name: "New Member" },
      custom_fields: [],
    });

    expect(res.status).toBe(200);
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringMatching(/URGENT/i) })
    );
  });
});

// ── Signature verification ────────────────────────────────────────────────────

describe("webhook: signature verification", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/webhook/route");
    const res = await POST(
      new Request("https://test.com/api/webhook", {
        method: "POST",
        body: "{}",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Signature mismatch");
    });
    const { POST } = await import("@/app/api/webhook/route");
    const res = await POST(
      new Request("https://test.com/api/webhook", {
        method: "POST",
        headers: { "stripe-signature": "bad_sig" },
        body: "{}",
      })
    );
    expect(res.status).toBe(400);
  });
});

// ── payment receipts & recovery emails ────────────────────────────────────────

describe("webhook: payment receipts & recovery emails", () => {
  const paidInvoice = (overrides: object = {}) => ({
    billing_reason: "subscription_cycle",
    customer_email: "member@test.com",
    customer_name: "Test Member",
    subscription: "sub_123",
    amount_paid: 75000,
    currency: "usd",
    hosted_invoice_url: "https://stripe.test/inv_1",
    lines: { data: [{ price: { id: "price_1Tiiku8sHKVNeGWtthSeTog0" }, description: "Gold" }] },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSupabaseChain();
    mockResendSend.mockResolvedValue({ id: "ok" });
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue({ metadata: { clerkUserId: "user_abc" } });
    mockGrantProRole.mockResolvedValue(undefined);
    mockUpdateUserMetadata.mockResolvedValue({});
  });

  it("emails the member a receipt on a normal subscription payment (no recovery)", async () => {
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: "gold", suspendedTier: null, gracePeriodEnd: null } });

    await callWebhook("invoice.paid", paidInvoice({ billing_reason: "subscription_create" }));

    const calls = mockResendSend.mock.calls.map((c) => c[0]);
    const receipt = calls.find((c) => c.to === "member@test.com");
    expect(receipt).toBeDefined();
    expect(receipt!.subject).toMatch(/receipt/i);
    // no coach "recovered" email on a normal payment
    expect(calls.find((c) => c.to === "coach@test.com")).toBeUndefined();
  });

  it("sends 'access restored' email to member + 'recovered' email to coach after a lock", async () => {
    mockGetUser
      .mockResolvedValueOnce({ publicMetadata: { tier: null, suspendedTier: "gold", discordUserId: "d1" } })
      .mockResolvedValueOnce({ publicMetadata: { tier: "gold", discordUserId: "d1" } });

    await callWebhook("invoice.paid", paidInvoice());

    const calls = mockResendSend.mock.calls.map((c) => c[0]);
    const member = calls.find((c) => c.to === "member@test.com");
    const coach = calls.find((c) => c.to === "coach@test.com");
    expect(member?.subject).toMatch(/restored/i);
    expect(coach?.subject).toMatch(/recovered/i);
  });

  it("treats a within-grace recovery as recovery (restored email + coach notice)", async () => {
    mockGetUser.mockResolvedValue({
      publicMetadata: { tier: "gold", suspendedTier: null, gracePeriodEnd: new Date(Date.now() + 60000).toISOString() },
    });

    await callWebhook("invoice.paid", paidInvoice());

    const calls = mockResendSend.mock.calls.map((c) => c[0]);
    expect(calls.find((c) => c.to === "member@test.com")?.subject).toMatch(/restored/i);
    expect(calls.find((c) => c.to === "coach@test.com")).toBeDefined();
  });

  it("sends a receipt for a lifetime one-time purchase (no invoice.paid fires for these)", async () => {
    mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValue({
      data: [{ price: { id: "price_1Tiil68sHKVNeGWt4SFHY6P5" } }], // lifetime test price
    });
    mockGetUser.mockResolvedValue({ publicMetadata: { tier: null } });
    mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] });

    await callWebhook("checkout.session.completed", {
      id: "cs_test",
      mode: "payment",
      amount_total: 200000,
      currency: "usd",
      metadata: { clerkUserId: "user_abc" },
      customer: "cus_new",
      customer_details: { email: "lifer@test.com", name: "Life Time" },
      custom_fields: [],
    });

    const calls = mockResendSend.mock.calls.map((c) => c[0]);
    const receipt = calls.find((c) => c.to === "lifer@test.com" && /receipt/i.test(c.subject));
    expect(receipt).toBeDefined();
  });
});
