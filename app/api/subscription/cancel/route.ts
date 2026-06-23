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

  const cancelAt = new Date(updated.current_period_end * 1000).toISOString();

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { cancelAt },
  });

  return NextResponse.json({ cancelAt });
}
