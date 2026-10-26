import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, clerkUserId } = await request.json() as { action: string; clerkUserId?: string };

  if (action !== "cancel") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // 1. Cancel Stripe subscription immediately
  try {
    await stripe.subscriptions.cancel(id);
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }

  // 2. Remove tier from Clerk so member loses access immediately
  if (clerkUserId) {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUserId, {
        publicMetadata: { tier: null },
      });
    } catch (err) {
      console.error("Failed to update Clerk tier on cancel:", err);
    }
  }

  return NextResponse.json({ success: true });
}
