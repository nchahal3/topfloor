import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const { paymentMethodId, retry } = await request.json() as { paymentMethodId: string; retry?: boolean };
  if (!paymentMethodId) return NextResponse.json({ error: "paymentMethodId required" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let customerId = (user?.publicMetadata?.stripeCustomerId as string) ?? null;
  if (!customerId) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    customerId = customers.data[0]?.id ?? null;
  }
  if (!customerId) return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });

  // Set as default on customer
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Find active OR past_due subscription and update its default PM
  let sub: Stripe.Subscription | null = null;
  for (const status of ["active", "past_due"] as const) {
    const result = await stripe.subscriptions.list({ customer: customerId, status, limit: 1 });
    if (result.data.length) { sub = result.data[0]; break; }
  }

  if (sub) {
    await stripe.subscriptions.update(sub.id, {
      default_payment_method: paymentMethodId,
    });

    // Retry the latest unpaid invoice only when coming from payment recovery flow
    if (!retry) return NextResponse.json({ success: true });
    const latestInvoiceId = typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : (sub.latest_invoice as Stripe.Invoice | null)?.id ?? null;

    if (latestInvoiceId) {
      // Always expand the PaymentIntent so we can inspect its status directly.
      const invoice = await stripe.invoices.retrieve(latestInvoiceId, {
        expand: ["payment_intent"],
      });

      if (invoice.status === "open") {
        type InvoiceWithPi = { payment_intent?: Stripe.PaymentIntent | string | null };
        const piField = (invoice as unknown as InvoiceWithPi).payment_intent;
        const piObj = piField && typeof piField === "object" ? (piField as Stripe.PaymentIntent) : null;

        // After an off-session renewal fails with authentication_required, Stripe puts the PI
        // into requires_payment_method (not requires_action). Both states mean the customer
        // must complete 3DS on-session - return the client_secret so the frontend handles it.
        if (piObj?.client_secret && (piObj.status === "requires_action" || piObj.status === "requires_payment_method")) {
          return NextResponse.json({ success: true, charged: false, requiresAction: true, clientSecret: piObj.client_secret });
        }

        // PI is in a payable state - attempt the charge now.
        try {
          await stripe.invoices.pay(latestInvoiceId, { payment_method: paymentMethodId });
          return NextResponse.json({ success: true, charged: true });
        } catch (err) {
          if (err instanceof Stripe.errors.StripeError) {
            // Re-fetch invoice to get the PI state after the pay attempt.
            try {
              const refreshed = await stripe.invoices.retrieve(latestInvoiceId, { expand: ["payment_intent"] });
              const rPi = (refreshed as unknown as InvoiceWithPi).payment_intent;
              const rPiObj = rPi && typeof rPi === "object" ? (rPi as Stripe.PaymentIntent) : null;
              if (rPiObj?.client_secret && (rPiObj.status === "requires_action" || rPiObj.status === "requires_payment_method")) {
                return NextResponse.json({ success: true, charged: false, requiresAction: true, clientSecret: rPiObj.client_secret });
              }
            } catch { /* fall through */ }
            return NextResponse.json({ success: true, charged: false, chargeError: err.message });
          }
          return NextResponse.json({ success: true, charged: false, chargeError: "Payment declined. Please try a different card." });
        }
      }
    }
  }

  return NextResponse.json({ success: true, charged: false });
}
