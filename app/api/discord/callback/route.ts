import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { grantProRole } from "@/lib/discord-roles";

const DISCORD_API = "https://discord.com/api/v10";
const BASE_URL = process.env.NEXT_PUBLIC_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?discord=error`);
  }

  // Verify state = userId.hmac
  const [userId, hmac] = state.split(".");
  if (!userId || !hmac) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?discord=error`);
  }
  const expected = createHmac("sha256", process.env.DISCORD_CLIENT_SECRET!)
    .update(userId)
    .digest("hex");
  if (hmac !== expected) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?discord=error`);
  }

  // Exchange code for access token
  const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_OAUTH_REDIRECT!,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[discord-callback] token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${BASE_URL}/dashboard?discord=error`);
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;

  // Fetch Discord user info
  const userRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    console.error("[discord-callback] user fetch failed:", await userRes.text());
    return NextResponse.redirect(`${BASE_URL}/dashboard?discord=error`);
  }

  const discordUser = await userRes.json();
  const discordUserId: string = discordUser.id;
  const discordUsername: string = discordUser.username;

  // Save to Clerk
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      discordUserId,
      discordUsername,
    },
  });

  // Auto-join them to the server via guilds.join scope
  await fetch(`${DISCORD_API}/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  }).catch((e) => console.error("[discord-callback] guild join failed:", e));

  // Grant Pro role if they have a paid tier
  const tier = user.publicMetadata?.tier;
  if (tier) {
    await grantProRole(discordUserId);
  }

  return NextResponse.redirect(`${BASE_URL}/dashboard?discord=connected`);
}
