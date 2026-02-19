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

export function getFireLevel(cost: number): { flames: number; color: string; animation: string } {
  if (cost >= 2500) return { flames: 10, color: "text-red-600", animation: "animate-flame-rage" };
  if (cost >= 2000) return { flames: 9, color: "text-red-500", animation: "animate-flame-rage" };
  if (cost >= 1500) return { flames: 8, color: "text-red-500", animation: "animate-flame-dance" };
  if (cost >= 1100) return { flames: 7, color: "text-red-400", animation: "animate-flame-dance" };
  if (cost >= 800) return { flames: 6, color: "text-orange-500", animation: "animate-flame-dance" };
  if (cost >= 500) return { flames: 5, color: "text-orange-500", animation: "animate-flame-flicker" };
  if (cost >= 300) return { flames: 4, color: "text-orange-400", animation: "animate-flame-flicker" };
  if (cost >= 125) return { flames: 3, color: "text-orange-400", animation: "animate-flame-flicker" };
  if (cost >= 25) return { flames: 2, color: "text-yellow-500", animation: "" };
  if (cost > 0) return { flames: 1, color: "text-yellow-500", animation: "" };
  return { flames: 0, color: "text-muted-foreground", animation: "" };
}
