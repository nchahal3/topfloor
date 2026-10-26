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
      const invoice = await stripe.invoices.retrieve(latestInvoiceId);

      if (invoice.status === "open") {
        // Stripe dahlia API (v22+) removed payment_intent from Invoice. The PaymentIntent is
        // now accessed via the invoicePayments sub-resource.
        const pi = await getOpenPaymentIntent(stripe, latestInvoiceId);

        // PI is waiting for 3DS or needs a payment method confirmed on-session.
        if (pi?.client_secret && (pi.status === "requires_action" || pi.status === "requires_payment_method")) {
          return NextResponse.json({ success: true, charged: false, requiresAction: true, clientSecret: pi.client_secret });
        }

        // PI is in a payable or canceled state — attempt charge with off_session:false so
        // Stripe can present a 3DS challenge if the new card requires it.
        try {
          await stripe.invoices.pay(latestInvoiceId, {
            payment_method: paymentMethodId,
            off_session: false,
          });
          return NextResponse.json({ success: true, charged: true });
        } catch (err) {
          if (err instanceof Stripe.errors.StripeError) {
            // err.payment_intent is set by Stripe when the error is requires_action
            if (err.payment_intent) {
              const errPi = err.payment_intent as Stripe.PaymentIntent;
              if (errPi.client_secret && (errPi.status === "requires_action" || errPi.status === "requires_payment_method")) {
                return NextResponse.json({ success: true, charged: false, requiresAction: true, clientSecret: errPi.client_secret });
              }
            }
            // Re-fetch via invoicePayments to get the updated PI state after the attempt.
            const refreshedPi = await getOpenPaymentIntent(stripe, latestInvoiceId);
            if (refreshedPi?.client_secret && (refreshedPi.status === "requires_action" || refreshedPi.status === "requires_payment_method")) {
              return NextResponse.json({ success: true, charged: false, requiresAction: true, clientSecret: refreshedPi.client_secret });
            }
            return NextResponse.json({ success: true, charged: false, chargeError: err.message });
          }
          return NextResponse.json({ success: true, charged: false, chargeError: "Payment declined. Please try a different card." });
        }
      }
    }
  }

  return NextResponse.json({ success: true, charged: false });
}

async function getOpenPaymentIntent(stripe: Stripe, invoiceId: string): Promise<Stripe.PaymentIntent | null> {
  try {
    const ipList = await stripe.invoicePayments.list({
      invoice: invoiceId,
      status: "open",
      expand: ["data.payment.payment_intent"],
    });
    const ipPayment = ipList.data[0]?.payment;
    if (ipPayment?.type !== "payment_intent" || !ipPayment.payment_intent) return null;
    if (typeof ipPayment.payment_intent === "string") {
      return await stripe.paymentIntents.retrieve(ipPayment.payment_intent);
    }
    return ipPayment.payment_intent as Stripe.PaymentIntent;
  } catch {
    return null;
  }
}
