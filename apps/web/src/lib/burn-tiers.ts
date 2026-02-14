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
  inferno:  { name: "inferno",  embers: 35,  flames: 18, glowOpacity: 0.45, glowHeight: "30vh", sideGlow: true, sideGlowWidth: "6vw",  topGlow: true, topGlowHeight: "12vh", isInferno: true },
  blazing:  { name: "blazing",  embers: 32,  flames: 18, glowOpacity: 0.4,  glowHeight: "26vh", sideGlow: true, sideGlowWidth: "5vw",  topGlow: false, topGlowHeight: "0" },
  burning:  { name: "burning",  embers: 25,  flames: 14, glowOpacity: 0.3,  glowHeight: "22vh", sideGlow: true, sideGlowWidth: "3.5vw", topGlow: false, topGlowHeight: "0" },
  warm:     { name: "warm",     embers: 14,  flames: 6,  glowOpacity: 0.18, glowHeight: "14vh", sideGlow: true, sideGlowWidth: "2vw",  topGlow: false, topGlowHeight: "0" },
  spark:    { name: "spark",    embers: 8,   flames: 2,  glowOpacity: 0.1,  glowHeight: "8vh",  sideGlow: false, sideGlowWidth: "0",   topGlow: false, topGlowHeight: "0" },
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
