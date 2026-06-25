export type Tier = "bronze" | "silver" | "gold" | "lifetime" | null;

const TIER_ORDER: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  lifetime: 4,
};

export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  if (!requiredTier) return true;
  if (!userTier) return false;
  return (TIER_ORDER[userTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 0);
}

export const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  lifetime: "Lifetime",
};

export const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#f0c040",
  lifetime: "#00ff88",
};

// Maps Stripe price IDs to tiers (includes both live and test/sandbox IDs)
export const PRICE_TIER: Record<string, Tier> = {
  price_1TiphA8U0Yle7MZgUELrqhSV: "bronze",
  price_1TiphA8U0Yle7MZggKFKtsl8: "silver",
  price_1TiphA8U0Yle7MZgkmDxN3lZ: "gold",
  price_1TiphC8U0Yle7MZg1ivchT6j: "lifetime",
  price_1TiikP8sHKVNeGWtxjodurtl: "bronze",
  price_1Tiike8sHKVNeGWtJr1gxDZx: "silver",
  price_1Tiiku8sHKVNeGWtthSeTog0: "gold",
  price_1Tiil68sHKVNeGWt4SFHY6P5: "lifetime",
};
