import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const customers = await stripe.customers.list({ email, limit: 1 });
  if (!customers.data.length) return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });

  const customerId = customers.data[0].id;

  const invoices = await stripe.invoices.list({ customer: customerId, status: "open", limit: 1 });
  if (!invoices.data.length) return NextResponse.json({ error: "No outstanding invoice found" }, { status: 404 });

  const invoice = invoices.data[0];
  return NextResponse.json({ url: invoice.hosted_invoice_url });
}
