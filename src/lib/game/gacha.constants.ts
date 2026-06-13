// Gacha pull rates — pure constants, safe for client & server.
// No pity, no soft pity: every pull is an independent roll.

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "elite"
  | "epic"
  | "legendary"
  | "mythic"
  | "ex";
export type BannerType = "standard" | "featured" | "streak" | "pact_seal" | "event";

export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  elite: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
  ex: 7,
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9E9E9E",
  uncommon: "#81C784",
  rare: "#4FC3F7",
  elite: "#FFB74D",
  epic: "#CE93D8",
  legendary: "#FFD54F",
  mythic: "#FF8A65",
  ex: "#FFFFFF",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: "none",
  uncommon: "0 0 8px rgba(129,199,132,0.30)",
  rare: "0 0 12px rgba(79,195,247,0.40)",
  elite: "0 0 14px rgba(255,183,77,0.45)",
  epic: "0 0 18px rgba(206,147,216,0.50)",
  legendary: "0 0 28px rgba(255,213,79,0.65), 0 0 56px rgba(255,213,79,0.20)",
  mythic: "0 0 32px rgba(255,138,101,0.70), 0 0 64px rgba(200,80,40,0.30)",
  ex: "0 0 48px rgba(255,255,255,0.90), 0 0 96px rgba(255,255,255,0.40)",
};

// Pull rates by banner type. Every pull is independent — no pity guarantees.
export const PULL_RATES: Record<BannerType, Record<Rarity, number>> = {
  standard: {
    common: 0.45,
    uncommon: 0.25,
    rare: 0.17,
    elite: 0.08,
    epic: 0.04,
    legendary: 0.008,
    mythic: 0.0015,
    ex: 0.0005,
  },
  featured: {
    common: 0.35,
    uncommon: 0.22,
    rare: 0.25,
    elite: 0.12,
    epic: 0.05,
    legendary: 0.009,
    mythic: 0.0008,
    ex: 0,
  },
  streak: {
    common: 0.25,
    uncommon: 0.2,
    rare: 0.3,
    elite: 0.16,
    epic: 0.07,
    legendary: 0.015,
    mythic: 0.004,
    ex: 0.001,
  },
  pact_seal: {
    common: 0.1,
    uncommon: 0.15,
    rare: 0.25,
    elite: 0.22,
    epic: 0.15,
    legendary: 0.08,
    mythic: 0.04,
    ex: 0.01,
  },
  event: {
    common: 0.4,
    uncommon: 0.23,
    rare: 0.2,
    elite: 0.1,
    epic: 0.05,
    legendary: 0.015,
    mythic: 0.004,
    ex: 0.001,
  },
};
