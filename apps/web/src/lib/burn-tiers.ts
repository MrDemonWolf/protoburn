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
  inferno:  { name: "inferno",  embers: 55,  flames: 28, glowOpacity: 0.6,  glowHeight: "40vh", sideGlow: true, sideGlowWidth: "7vw",  topGlow: true, topGlowHeight: "14vh", isInferno: true },
  blazing:  { name: "blazing",  embers: 48,  flames: 24, glowOpacity: 0.5,  glowHeight: "35vh", sideGlow: true, sideGlowWidth: "5.5vw", topGlow: true, topGlowHeight: "8vh" },
  burning:  { name: "burning",  embers: 38,  flames: 18, glowOpacity: 0.42, glowHeight: "28vh", sideGlow: true, sideGlowWidth: "4vw",  topGlow: false, topGlowHeight: "0" },
  warm:     { name: "warm",     embers: 28,  flames: 14, glowOpacity: 0.35, glowHeight: "22vh", sideGlow: true, sideGlowWidth: "3vw",  topGlow: false, topGlowHeight: "0" },
  spark:    { name: "spark",    embers: 20,  flames: 8,  glowOpacity: 0.25, glowHeight: "15vh", sideGlow: true, sideGlowWidth: "1.5vw", topGlow: false, topGlowHeight: "0" },
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
