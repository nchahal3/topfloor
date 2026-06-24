type DiscordField = { name: string; value: string; inline?: boolean };

interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordField[];
  description?: string;
}

export async function sendDiscordLog(embed: DiscordEmbed) {
  const url = process.env.DISCORD_LOG_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [{ ...embed, timestamp: new Date().toISOString() }] }),
  }).catch(() => {});
}
