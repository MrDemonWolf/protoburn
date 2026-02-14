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
  meltdown: { name: "meltdown", embers: 120, flames: 60, glowOpacity: 0.9, glowHeight: "75vh", sideGlow: true, sideGlowWidth: "10vw", topGlow: true, topGlowHeight: "20vh", isMeltdown: true },
  inferno:  { name: "inferno",  embers: 45,  flames: 22, glowOpacity: 0.5,  glowHeight: "35vh", sideGlow: true, sideGlowWidth: "6vw",  topGlow: true, topGlowHeight: "12vh", isInferno: true },
  blazing:  { name: "blazing",  embers: 40,  flames: 20, glowOpacity: 0.45, glowHeight: "30vh", sideGlow: true, sideGlowWidth: "5vw",  topGlow: false, topGlowHeight: "0" },
  burning:  { name: "burning",  embers: 32,  flames: 16, glowOpacity: 0.35, glowHeight: "25vh", sideGlow: true, sideGlowWidth: "3.5vw", topGlow: false, topGlowHeight: "0" },
  warm:     { name: "warm",     embers: 22,  flames: 10, glowOpacity: 0.28, glowHeight: "18vh", sideGlow: true, sideGlowWidth: "2.5vw", topGlow: false, topGlowHeight: "0" },
  spark:    { name: "spark",    embers: 16,  flames: 6,  glowOpacity: 0.2,  glowHeight: "12vh", sideGlow: false, sideGlowWidth: "0",   topGlow: false, topGlowHeight: "0" },
  cold:     { name: "cold",     embers: 0,   flames: 0,  glowOpacity: 0,    glowHeight: "0",    sideGlow: false, sideGlowWidth: "0",   topGlow: false, topGlowHeight: "0" },
};

export function getBurnTier(monthlyTokens: number): BurnTier {
  if (monthlyTokens >= 4_000_000_000)  return TIERS.meltdown;
  if (monthlyTokens >= 2_000_000_000)  return TIERS.inferno;
  if (monthlyTokens >= 1_000_000_000)  return TIERS.blazing;
  if (monthlyTokens >= 200_000_000)    return TIERS.burning;
  if (monthlyTokens >= 100_000_000)    return TIERS.warm;
  if (monthlyTokens >= 20_000_000)     return TIERS.spark;
  return TIERS.cold;
}
