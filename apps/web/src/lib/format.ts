export function formatNumber(n: number): string {
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
  if (cost >= 100) return { flames: 5, color: "text-red-500" };
  if (cost >= 50) return { flames: 4, color: "text-red-500" };
  if (cost >= 20) return { flames: 3, color: "text-orange-500" };
  if (cost >= 5) return { flames: 2, color: "text-orange-400" };
  if (cost > 0) return { flames: 1, color: "text-yellow-500" };
  return { flames: 0, color: "text-muted-foreground" };
}
