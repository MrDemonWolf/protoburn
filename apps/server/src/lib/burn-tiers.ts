export function getBurnTierName(monthlyTokens: number): string {
  if (monthlyTokens >= 20_000_000) return "meltdown";
  if (monthlyTokens >= 10_000_000) return "inferno";
  if (monthlyTokens >= 5_000_000) return "blazing";
  if (monthlyTokens >= 1_000_000) return "burning";
  if (monthlyTokens >= 500_000) return "warm";
  if (monthlyTokens >= 100_000) return "spark";
  return "cold";
}
