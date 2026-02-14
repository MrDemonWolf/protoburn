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
