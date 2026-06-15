import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Tier } from "@/lib/tier";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clerkUserId, tier } = await request.json() as { clerkUserId: string; tier: Tier };

  if (!clerkUserId) {
    return NextResponse.json({ error: "clerkUserId required" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { tier: tier ?? null },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update tier:", err);
    return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
  }
}
