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

  const customerId = customers.data[0].id;
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
  if (!subscriptions.data.length) return NextResponse.json({ subscription: null, card: null });

  const sub = subscriptions.data[0];
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const nextBillingDate = periodEnd
    ? new Date(periodEnd * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  let card = null;
  try {
    const pmId = typeof sub.default_payment_method === "string"
      ? sub.default_payment_method
      : (sub.default_payment_method as Stripe.PaymentMethod | null)?.id
        ?? (typeof customers.data[0].invoice_settings?.default_payment_method === "string"
          ? customers.data[0].invoice_settings.default_payment_method
          : null);

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

  return NextResponse.json({ subscription: { nextBillingDate }, card });
}
