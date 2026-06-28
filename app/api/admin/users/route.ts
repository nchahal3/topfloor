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
    let userId = clerkUserId ?? null;

    if (!userId) {
      if (!email) return NextResponse.json({ error: "clerkUserId or email required" }, { status: 400 });
      const users = await clerk.users.getUserList({ emailAddress: [email] });
      userId = users.data[0]?.id ?? null;
    }

    if (!userId) return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });

    await clerk.users.deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
