import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clerkUserId, email } = await request.json() as { clerkUserId?: string; email?: string };

  try {
    const clerk = await clerkClient();

    // Always look up by email in the current Clerk instance — ignore cross-instance IDs
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    const userId = users.data[0]?.id ?? (clerkUserId ?? null);

    if (!userId) return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });

    await clerk.users.deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Clerk throws when user doesn't exist in this instance — treat as already gone
    if (msg.includes("not found") || msg.includes("No user") || msg.includes("404")) {
      return NextResponse.json({ error: "User has no account in this environment — nothing to delete." }, { status: 404 });
    }
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
