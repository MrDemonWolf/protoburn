export function getBurnTierName(monthlyTokens: number): string {
  if (monthlyTokens >= 4_500_000_000) return "meltdown";
  if (monthlyTokens >= 3_000_000_000) return "inferno";
  if (monthlyTokens >= 1_500_000_000) return "blazing";
  if (monthlyTokens >= 600_000_000) return "burning";
  if (monthlyTokens >= 150_000_000) return "warm";
  if (monthlyTokens >= 7_500_000) return "spark";
  return "cold";
}
