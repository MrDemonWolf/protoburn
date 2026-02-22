export interface BurnTier {
  name: string;
  embers: number;
  flames: number;
  glowOpacity: number;
  glowHeight: string;
  sideGlow: boolean;
  sideGlowWidth: string;
  topGlow: boolean;
  topGlowHeight: string;
  isInferno?: boolean;
  isMeltdown?: boolean;
}

export const TIERS: Record<string, BurnTier> = {
  meltdown: { name: "meltdown", embers: 360, flames: 180, glowOpacity: 0.99, glowHeight: "98vh", sideGlow: true, sideGlowWidth: "25vw", topGlow: true, topGlowHeight: "40vh", isMeltdown: true },
  inferno:  { name: "inferno",  embers: 165, flames: 85,  glowOpacity: 0.92, glowHeight: "80vh", sideGlow: true, sideGlowWidth: "20vw", topGlow: true, topGlowHeight: "30vh", isInferno: true },
  blazing:  { name: "blazing",  embers: 145, flames: 72,  glowOpacity: 0.82, glowHeight: "75vh", sideGlow: true, sideGlowWidth: "16vw", topGlow: true, topGlowHeight: "20vh" },
  burning:  { name: "burning",  embers: 115, flames: 55,  glowOpacity: 0.72, glowHeight: "65vh", sideGlow: true, sideGlowWidth: "12vw", topGlow: false, topGlowHeight: "0" },
  warm:     { name: "warm",     embers: 85,  flames: 42,  glowOpacity: 0.62, glowHeight: "50vh", sideGlow: true, sideGlowWidth: "10vw", topGlow: false, topGlowHeight: "0" },
  spark:    { name: "spark",    embers: 60,  flames: 25,  glowOpacity: 0.52, glowHeight: "35vh", sideGlow: true, sideGlowWidth: "6vw",  topGlow: false, topGlowHeight: "0" },
  cold:     { name: "cold",     embers: 0,   flames: 0,   glowOpacity: 0,    glowHeight: "0",    sideGlow: false, sideGlowWidth: "0",   topGlow: false, topGlowHeight: "0" },
};

export function getBurnTier(monthlyTokens: number): BurnTier {
  if (monthlyTokens >= 4_500_000_000)  return TIERS.meltdown;
  if (monthlyTokens >= 3_000_000_000)  return TIERS.inferno;
  if (monthlyTokens >= 1_500_000_000)  return TIERS.blazing;
  if (monthlyTokens >= 600_000_000)    return TIERS.burning;
  if (monthlyTokens >= 150_000_000)    return TIERS.warm;
  if (monthlyTokens >= 7_500_000)      return TIERS.spark;
  return TIERS.cold;
}
