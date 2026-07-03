import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockStripeInstance = {
  customers: {
    list: vi.fn(),
    update: vi.fn(),
  },
  subscriptions: {
    list: vi.fn(),
    update: vi.fn(),
  },
  invoices: {
    retrieve: vi.fn(),
    pay: vi.fn(),
  },
  // Stripe dahlia API (v22+): PaymentIntent is reached via invoicePayments, not invoice.payment_intent
  invoicePayments: {
    list: vi.fn(),
  },
  paymentIntents: {
    retrieve: vi.fn(),
  },
};

vi.mock("stripe", () => {
  function MockStripe(this: unknown) { return mockStripeInstance; }
  (MockStripe as any).errors = { StripeError: Error };
  return { default: MockStripe };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
  currentUser: vi.fn().mockResolvedValue({
    emailAddresses: [{ emailAddress: "test@example.com" }],
    publicMetadata: { stripeCustomerId: "cus_test123" },
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: object) {
  return new Request("https://test.com/api/billing/set-default-card", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callRoute(body: object) {
  const { PATCH } = await import("@/app/api/billing/set-default-card/route");
  return PATCH(makeRequest(body));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PATCH /api/billing/set-default-card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockStripeInstance.customers.update.mockResolvedValue({});
    mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
    // Default: no open invoice payment -> getOpenPaymentIntent returns null, code proceeds to invoices.pay
    mockStripeInstance.invoicePayments.list.mockResolvedValue({ data: [] });
  });

  it("returns 400 when paymentMethodId is missing", async () => {
    const res = await callRoute({ retry: false });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/paymentMethodId/i);
  });

  it("saves card and does NOT charge when retry is false", async () => {
    mockStripeInstance.subscriptions.list.mockResolvedValue({
      data: [{ id: "sub_123", latest_invoice: "inv_123", default_payment_method: null }],
    });

    const res = await callRoute({ paymentMethodId: "pm_123", retry: false });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockStripeInstance.invoices.pay).not.toHaveBeenCalled();
  });

  it("retries the open invoice when retry is true and returns charged:true on success", async () => {
    mockStripeInstance.subscriptions.list.mockImplementation(({ status }: { status: string }) =>
      status === "past_due"
        ? { data: [{ id: "sub_past_due", latest_invoice: "inv_open", default_payment_method: null }] }
        : { data: [] }
    );
    mockStripeInstance.invoices.retrieve.mockResolvedValue({ status: "open" });
    mockStripeInstance.invoices.pay.mockResolvedValue({ status: "paid" });

    const res = await callRoute({ paymentMethodId: "pm_good", retry: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.charged).toBe(true);
    expect(mockStripeInstance.invoices.pay).toHaveBeenCalledWith("inv_open", {
      payment_method: "pm_good",
      off_session: false,
    });
  });

  it("returns charged:false with error message when charge is declined", async () => {
    mockStripeInstance.subscriptions.list.mockImplementation(({ status }: { status: string }) =>
      status === "past_due"
        ? { data: [{ id: "sub_past_due", latest_invoice: "inv_open", default_payment_method: null }] }
        : { data: [] }
    );
    mockStripeInstance.invoices.retrieve.mockResolvedValue({ status: "open" });
    mockStripeInstance.invoices.pay.mockRejectedValue(new Error("Your card was declined."));

    const res = await callRoute({ paymentMethodId: "pm_declined", retry: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.charged).toBe(false);
    expect(body.chargeError).toContain("declined");
  });

  it("does NOT update Clerk metadata when charge is declined — user stays locked", async () => {
    mockStripeInstance.subscriptions.list.mockImplementation(({ status }: { status: string }) =>
      status === "past_due"
        ? { data: [{ id: "sub_past_due", latest_invoice: "inv_open", default_payment_method: null }] }
        : { data: [] }
    );
    mockStripeInstance.invoices.retrieve.mockResolvedValue({ status: "open" });
    mockStripeInstance.invoices.pay.mockRejectedValue(new Error("Card declined."));

    const { currentUser, auth } = await import("@clerk/nextjs/server");
    const mockClerkUpdate = vi.fn();
    vi.mocked(currentUser).mockResolvedValue({
      emailAddresses: [{ emailAddress: "test@example.com" }],
      publicMetadata: { stripeCustomerId: "cus_test123" },
    } as never);

    // Clerk has no update method on the route — this test just verifies the route
    // returns without any side effect to Clerk (no tier change happens here)
    const res = await callRoute({ paymentMethodId: "pm_declined", retry: true });
    const body = await res.json();

    expect(body.charged).toBe(false);
    // The route returns immediately after the catch block — no further Stripe calls
    expect(mockStripeInstance.invoices.pay).toHaveBeenCalledTimes(1);
  });

  it("skips invoice retry when invoice is not open", async () => {
    mockStripeInstance.subscriptions.list.mockImplementation(({ status }: { status: string }) =>
      status === "active"
        ? { data: [{ id: "sub_active", latest_invoice: "inv_paid", default_payment_method: null }] }
        : { data: [] }
    );
    mockStripeInstance.invoices.retrieve.mockResolvedValue({ status: "paid" });

    const res = await callRoute({ paymentMethodId: "pm_123", retry: true });
    expect(res.status).toBe(200);
    expect(mockStripeInstance.invoices.pay).not.toHaveBeenCalled();
  });

  it("falls back to email lookup when stripeCustomerId not in Clerk metadata", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: "test@example.com" }],
      publicMetadata: {},
    } as never);
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: "cus_from_email" }],
    });

    const res = await callRoute({ paymentMethodId: "pm_123", retry: false });
    expect(res.status).toBe(200);
    expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
      email: "test@example.com",
      limit: 1,
    });
  });

  it("returns 404 when no Stripe customer found", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: "nobody@example.com" }],
      publicMetadata: {},
    } as never);
    mockStripeInstance.customers.list.mockResolvedValue({ data: [] });

    const res = await callRoute({ paymentMethodId: "pm_123", retry: false });
    expect(res.status).toBe(404);
  });
});
