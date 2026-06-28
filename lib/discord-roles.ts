import { sendDiscordLog } from "@/lib/discord";
import { Resend } from "resend";

const DISCORD_API = "https://discord.com/api/v10";

async function setRole(discordUserId: string, action: "PUT" | "DELETE"): Promise<void> {
  const guildId = process.env.DISCORD_GUILD_ID!;
  const roleId = process.env.DISCORD_PRO_ROLE_ID!;
  const token = process.env.DISCORD_BOT_TOKEN!;

  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: action,
      headers: { Authorization: `Bot ${token}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord role ${action} failed: ${res.status} ${body}`);
  }
}

export async function grantProRole(discordUserId: string | null | undefined): Promise<void> {
  if (!discordUserId) return;
  try {
    await setRole(discordUserId, "PUT");
  } catch (err) {
    console.error("[discord-roles] grantProRole failed:", err);
    await alertFailure("grant", discordUserId, err);
  }
}

export async function revokeProRole(discordUserId: string | null | undefined): Promise<void> {
  if (!discordUserId) return;
  try {
    await setRole(discordUserId, "DELETE");
  } catch (err) {
    console.error("[discord-roles] revokeProRole failed:", err);
    await alertFailure("revoke", discordUserId, err);
  }
}

async function alertFailure(action: string, discordUserId: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  sendDiscordLog({
    title: `⚠️ Discord role ${action} failed`,
    color: 0xff4444,
    fields: [
      { name: "Discord User ID", value: discordUserId, inline: true },
      { name: "Action", value: action, inline: true },
      { name: "Error", value: message, inline: false },
    ],
    description: "Manual role update may be required.",
  });
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "noreply@topfloortradesofficial.com",
    to: process.env.COACH_EMAIL!,
    subject: `⚠️ Discord role ${action} failed — manual fix needed`,
    html: `<p>Failed to ${action} Pro Memer role for Discord user <strong>${discordUserId}</strong>.</p><p>Error: ${message}</p><p>Go to the Floor Discord server and manually ${action === "grant" ? "add" : "remove"} the Pro Memer role.</p>`,
  }).catch(() => {});
}
