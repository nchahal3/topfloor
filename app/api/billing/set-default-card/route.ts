import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const { paymentMethodId } = await request.json() as { paymentMethodId: string };
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

  // Also set on active subscription if exists
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
  if (subscriptions.data.length) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      default_payment_method: paymentMethodId,
    });
  }

  return NextResponse.json({ success: true });
}
