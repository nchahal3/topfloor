import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function PATCH() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (!subscriptions.data.length) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const sub = subscriptions.data[0];
    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });

    const periodEnd = updated.current_period_end ?? sub.current_period_end;
    if (!periodEnd) {
      return NextResponse.json({ error: "Could not determine billing period end" }, { status: 500 });
    }
    const cancelAt = new Date(periodEnd * 1000).toISOString();

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { cancelAt },
    });

    return NextResponse.json({ cancelAt });
  } catch (err) {
    console.error("[cancel-subscription]", err);
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
