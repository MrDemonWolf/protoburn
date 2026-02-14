export const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number; cacheWritePerMillion: number; cacheReadPerMillion: number }> = {
  "haiku-4-5": { inputPerMillion: 1.0, outputPerMillion: 5.0, cacheWritePerMillion: 1.25, cacheReadPerMillion: 0.1 },
  "sonnet-4-5": { inputPerMillion: 3.0, outputPerMillion: 15.0, cacheWritePerMillion: 3.75, cacheReadPerMillion: 0.3 },
  "opus-4-6": { inputPerMillion: 5.0, outputPerMillion: 25.0, cacheWritePerMillion: 6.25, cacheReadPerMillion: 0.5 },
};

const DEFAULT_PRICING = MODEL_PRICING["sonnet-4-5"]!;

function getTier(model: string): { inputPerMillion: number; outputPerMillion: number; cacheWritePerMillion: number; cacheReadPerMillion: number } {
  for (const [pattern, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.includes(pattern)) return pricing;
  }
  return DEFAULT_PRICING;
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number, cacheCreationTokens = 0, cacheReadTokens = 0): number {
  const tier = getTier(model);
  return (
    (inputTokens / 1_000_000) * tier.inputPerMillion +
    (outputTokens / 1_000_000) * tier.outputPerMillion +
    (cacheCreationTokens / 1_000_000) * tier.cacheWritePerMillion +
    (cacheReadTokens / 1_000_000) * tier.cacheReadPerMillion
  );
}
