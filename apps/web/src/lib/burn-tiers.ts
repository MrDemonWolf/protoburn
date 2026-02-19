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
  meltdown: { name: "meltdown", embers: 145, flames: 73, glowOpacity: 0.98, glowHeight: "88vh", sideGlow: true, sideGlowWidth: "12vw", topGlow: true, topGlowHeight: "24vh", isMeltdown: true },
  inferno:  { name: "inferno",  embers: 66,  flames: 34, glowOpacity: 0.73, glowHeight: "48vh", sideGlow: true, sideGlowWidth: "8.5vw", topGlow: true, topGlowHeight: "17vh", isInferno: true },
  blazing:  { name: "blazing",  embers: 58,  flames: 29, glowOpacity: 0.6,  glowHeight: "42vh", sideGlow: true, sideGlowWidth: "6.5vw", topGlow: true, topGlowHeight: "10vh" },
  burning:  { name: "burning",  embers: 46,  flames: 22, glowOpacity: 0.5,  glowHeight: "34vh", sideGlow: true, sideGlowWidth: "5vw",  topGlow: false, topGlowHeight: "0" },
  warm:     { name: "warm",     embers: 34,  flames: 17, glowOpacity: 0.42, glowHeight: "26vh", sideGlow: true, sideGlowWidth: "4vw",  topGlow: false, topGlowHeight: "0" },
  spark:    { name: "spark",    embers: 24,  flames: 10, glowOpacity: 0.31, glowHeight: "19vh", sideGlow: true, sideGlowWidth: "2.5vw", topGlow: false, topGlowHeight: "0" },
  cold:     { name: "cold",     embers: 0,   flames: 0,  glowOpacity: 0,    glowHeight: "0",    sideGlow: false, sideGlowWidth: "0",   topGlow: false, topGlowHeight: "0" },
};

export function getBurnTier(monthlyTokens: number): BurnTier {
  if (monthlyTokens >= 3_000_000_000)  return TIERS.meltdown;
  if (monthlyTokens >= 2_000_000_000)  return TIERS.inferno;
  if (monthlyTokens >= 1_000_000_000)  return TIERS.blazing;
  if (monthlyTokens >= 400_000_000)    return TIERS.burning;
  if (monthlyTokens >= 100_000_000)    return TIERS.warm;
  if (monthlyTokens >= 5_000_000)      return TIERS.spark;
  return TIERS.cold;
}
