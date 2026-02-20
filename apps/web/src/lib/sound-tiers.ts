export interface SoundTierConfig {
  crackle: { volume: number; rate: number } | null;
  rumble: { volume: number; frequency: number } | null;
  hiss: { volume: number } | null;
  alarm: { volume: number } | null;
}

export function tierToSoundConfig(tierName: string): SoundTierConfig {
  switch (tierName) {
    case "spark":
      return {
        crackle: { volume: 0.15, rate: 3 },
        rumble: null,
        hiss: null,
        alarm: null,
      };
    case "warm":
      return {
        crackle: { volume: 0.25, rate: 5 },
        rumble: { volume: 0.08, frequency: 60 },
        hiss: null,
        alarm: null,
      };
    case "burning":
      return {
        crackle: { volume: 0.35, rate: 8 },
        rumble: { volume: 0.15, frequency: 50 },
        hiss: { volume: 0.05 },
        alarm: null,
      };
    case "blazing":
      return {
        crackle: { volume: 0.45, rate: 12 },
        rumble: { volume: 0.25, frequency: 45 },
        hiss: { volume: 0.1 },
        alarm: null,
      };
    case "inferno":
      return {
        crackle: { volume: 0.55, rate: 18 },
        rumble: { volume: 0.35, frequency: 40 },
        hiss: { volume: 0.15 },
        alarm: null,
      };
    case "meltdown":
      return {
        crackle: { volume: 0.7, rate: 25 },
        rumble: { volume: 0.5, frequency: 35 },
        hiss: { volume: 0.2 },
        alarm: { volume: 0.3 },
      };
    default: // cold
      return {
        crackle: null,
        rumble: null,
        hiss: null,
        alarm: null,
      };
  }
}
