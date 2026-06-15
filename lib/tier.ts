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

// Maps Stripe price IDs to tiers
export const PRICE_TIER: Record<string, Tier> = {
  price_1TiikP8sHKVNeGWtxjodurtl: "bronze",
  price_1Tiike8sHKVNeGWtJr1gxDZx: "silver",
  price_1Tiiku8sHKVNeGWtthSeTog0: "gold",
  price_1Tiil68sHKVNeGWt4SFHY6P5: "lifetime",
};
