export function formatNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function cleanModelName(model: string) {
  return model
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "");
}

export function getFireLevel(cost: number): { flames: number; color: string } {
  if (cost >= 200) return { flames: 10, color: "text-red-600" };
  if (cost >= 150) return { flames: 9, color: "text-red-500" };
  if (cost >= 100) return { flames: 8, color: "text-red-500" };
  if (cost >= 75) return { flames: 7, color: "text-red-400" };
  if (cost >= 50) return { flames: 6, color: "text-orange-500" };
  if (cost >= 35) return { flames: 5, color: "text-orange-500" };
  if (cost >= 20) return { flames: 4, color: "text-orange-400" };
  if (cost >= 10) return { flames: 3, color: "text-orange-400" };
  if (cost >= 5) return { flames: 2, color: "text-yellow-500" };
  if (cost > 0) return { flames: 1, color: "text-yellow-500" };
  return { flames: 0, color: "text-muted-foreground" };
}
