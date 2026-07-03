import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_URL!));
  }

  const state = createHmac("sha256", process.env.DISCORD_CLIENT_SECRET!)
    .update(userId)
    .digest("hex");

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_OAUTH_REDIRECT!,
    response_type: "code",
    scope: "identify guilds.join",
    state: `${userId}.${state}`,
  });

  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
