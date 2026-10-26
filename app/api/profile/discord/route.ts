import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const discordUsername = typeof body.discordUsername === "string" ? body.discordUsername.trim() : "";

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { discordUsername: discordUsername || null },
  });

  return NextResponse.json({ ok: true });
}
