type DiscordField = { name: string; value: string; inline?: boolean };

interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordField[];
  description?: string;
}

// Which Discord channel to post to. "bookings" routes to the dedicated
// bookings text channel (DISCORD_BOOKINGS_WEBHOOK_URL); when that is unset it
// falls back to the main log channel so nothing breaks before it is configured.
type DiscordChannel = "log" | "bookings";

function webhookFor(channel: DiscordChannel): string | undefined {
  if (channel === "bookings") {
    return process.env.DISCORD_BOOKINGS_WEBHOOK_URL || process.env.DISCORD_LOG_WEBHOOK_URL;
  }
  return process.env.DISCORD_LOG_WEBHOOK_URL;
}

export async function sendDiscordLog(embed: DiscordEmbed, channel: DiscordChannel = "log") {
  const url = webhookFor(channel);
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [{ ...embed, timestamp: new Date().toISOString() }] }),
  }).catch(() => {});
}
