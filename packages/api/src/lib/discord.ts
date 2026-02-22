export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
  footer?: { text: string };
}

export async function sendDiscordWebhook(
  url: string,
  embed: DiscordEmbed,
): Promise<void> {
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ProtoBurn",
        embeds: [embed],
      }),
    });
  } catch {
    // Fire-and-forget — don't let webhook failures break the app
  }
}

export function buildSyncEmbed(stats: {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  recordCount: number;
  estimatedCost: number;
}): DiscordEmbed {
  return {
    title: "Sync Complete",
    color: 0x00aced,
    fields: [
      { name: "Records", value: stats.recordCount.toLocaleString(), inline: true },
      { name: "Input", value: stats.inputTokens.toLocaleString(), inline: true },
      { name: "Output", value: stats.outputTokens.toLocaleString(), inline: true },
      { name: "Cache Write", value: stats.cacheWriteTokens.toLocaleString(), inline: true },
      { name: "Cache Read", value: stats.cacheReadTokens.toLocaleString(), inline: true },
      { name: "Est. Cost", value: `$${stats.estimatedCost.toFixed(2)}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "ProtoBurn" },
  };
}

export function buildTierChangeEmbed(
  oldTier: string,
  newTier: string,
  monthlyTokens: number,
): DiscordEmbed {
  const escalation = tierRank(newTier) > tierRank(oldTier);
  return {
    title: escalation ? "Burn Tier Escalation" : "Burn Tier Change",
    description: `**${oldTier}** → **${newTier}**`,
    color: escalation ? 0xff4500 : 0xf59e0b,
    fields: [
      { name: "Monthly Tokens", value: monthlyTokens.toLocaleString(), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "ProtoBurn" },
  };
}

const TIER_ORDER = ["cold", "spark", "warm", "burning", "blazing", "inferno", "meltdown"];

function tierRank(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? 0 : idx;
}
