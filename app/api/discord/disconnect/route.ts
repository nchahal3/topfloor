import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revokeProRole } from "@/lib/discord-roles";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const discordUserId = user.publicMetadata?.discordUserId as string | undefined;

  // Remove role before clearing the ID so we still have it
  if (discordUserId) {
    await revokeProRole(discordUserId);
  }

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { discordUserId: null, discordUsername: null },
  });

  return NextResponse.json({ ok: true });
}
