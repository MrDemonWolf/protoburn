export const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  "haiku-4-5": { inputPerMillion: 1.0, outputPerMillion: 5.0 },
  "sonnet-4-5": { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  "opus-4-6": { inputPerMillion: 5.0, outputPerMillion: 25.0 },
};

const DEFAULT_PRICING = MODEL_PRICING["sonnet-4-5"]!;

function getTier(model: string): { inputPerMillion: number; outputPerMillion: number } {
  for (const [pattern, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.includes(pattern)) return pricing;
  }
  return DEFAULT_PRICING;
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const tier = getTier(model);
  return (inputTokens / 1_000_000) * tier.inputPerMillion + (outputTokens / 1_000_000) * tier.outputPerMillion;
}
