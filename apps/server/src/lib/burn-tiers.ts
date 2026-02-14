export function getBurnTierName(monthlyTokens: number): string {
  if (monthlyTokens >= 4_000_000_000) return "meltdown";
  if (monthlyTokens >= 2_000_000_000) return "inferno";
  if (monthlyTokens >= 1_000_000_000) return "blazing";
  if (monthlyTokens >= 200_000_000) return "burning";
  if (monthlyTokens >= 100_000_000) return "warm";
  if (monthlyTokens >= 20_000_000) return "spark";
  return "cold";
}
