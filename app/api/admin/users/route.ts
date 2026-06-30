import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === (await import("@/lib/admin-auth")).getAdminToken();
}

// Pulls a human-readable reason out of a Clerk API error (status + first error detail).
function clerkErrorDetail(err: unknown): { status?: number; detail: string } {
  const e = err as { status?: number; errors?: Array<{ message?: string; longMessage?: string }> };
  const status = typeof e?.status === "number" ? e.status : undefined;
  const detail =
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    (err instanceof Error ? err.message : String(err));
  return { status, detail };
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json() as { clerkUserId?: string; email?: string };
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    const clerk = await clerkClient();

    // Resolve the user in THIS Clerk instance by email. We deliberately ignore any
    // clerkUserId passed from the client — those can be cross-instance IDs (e.g. a
    // production ID showing on staging) that would 404 here and mask the real result.
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    const userId = users.data[0]?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "This member has no account in this Clerk environment — nothing to delete here." },
        { status: 404 },
      );
    }

    await clerk.users.deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, detail } = clerkErrorDetail(err);
    if (status === 404) {
      return NextResponse.json(
        { error: "This member has no account in this Clerk environment — nothing to delete here." },
        { status: 404 },
      );
    }
    console.error("Delete user error:", err);
    return NextResponse.json({ error: `Failed to delete user: ${detail}` }, { status: 500 });
  }
}
