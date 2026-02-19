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
  meltdown: { name: "meltdown", embers: 132, flames: 66, glowOpacity: 0.95, glowHeight: "80vh", sideGlow: true, sideGlowWidth: "11vw", topGlow: true, topGlowHeight: "22vh", isMeltdown: true },
  inferno:  { name: "inferno",  embers: 60,  flames: 31, glowOpacity: 0.66, glowHeight: "44vh", sideGlow: true, sideGlowWidth: "7.5vw", topGlow: true, topGlowHeight: "15vh", isInferno: true },
  blazing:  { name: "blazing",  embers: 53,  flames: 26, glowOpacity: 0.55, glowHeight: "38vh", sideGlow: true, sideGlowWidth: "6vw",  topGlow: true, topGlowHeight: "9vh" },
  burning:  { name: "burning",  embers: 42,  flames: 20, glowOpacity: 0.46, glowHeight: "31vh", sideGlow: true, sideGlowWidth: "4.5vw", topGlow: false, topGlowHeight: "0" },
  warm:     { name: "warm",     embers: 31,  flames: 15, glowOpacity: 0.38, glowHeight: "24vh", sideGlow: true, sideGlowWidth: "3.5vw", topGlow: false, topGlowHeight: "0" },
  spark:    { name: "spark",    embers: 22,  flames: 9,  glowOpacity: 0.28, glowHeight: "17vh", sideGlow: true, sideGlowWidth: "2vw",  topGlow: false, topGlowHeight: "0" },
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
