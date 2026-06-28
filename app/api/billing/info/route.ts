import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const customers = await stripe.customers.list({ email, limit: 1 });
  if (!customers.data.length) return NextResponse.json({ subscription: null, card: null });

  const customer = customers.data[0];
  const customerId = customer.id;

  // Find the most relevant subscription (active > past_due > any non-canceled)
  let sub: Stripe.Subscription | null = null;
  for (const status of ["active", "past_due", "trialing", "incomplete"] as const) {
    const result = await stripe.subscriptions.list({ customer: customerId, status, limit: 1 });
    if (result.data.length) { sub = result.data[0]; break; }
  }

  const periodEnd = sub ? (sub as unknown as { current_period_end?: number }).current_period_end : null;
  const nextBillingDate = periodEnd
    ? new Date(periodEnd * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  // Get card — check subscription PM first, then customer default PM, then list PMs directly
  let card = null;
  try {
    let pmId: string | null = null;

    if (sub) {
      pmId = typeof sub.default_payment_method === "string"
        ? sub.default_payment_method
        : (sub.default_payment_method as Stripe.PaymentMethod | null)?.id ?? null;
    }

    if (!pmId) {
      pmId = typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | null)?.id ?? null;
    }

    if (!pmId) {
      const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
      pmId = pms.data[0]?.id ?? null;
    }

    if (pmId) {
      const pm = await stripe.paymentMethods.retrieve(pmId);
      if (pm.card) {
        card = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }
    }
  } catch {}

  return NextResponse.json({
    subscription: nextBillingDate ? { nextBillingDate } : null,
    card,
  });
}
