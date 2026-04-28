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
  price_1TRIBdRxClGX2uTFE404PcWF: "bronze",   // $200/mo Bronze
  price_1TPYX3RxClGX2uTFzwnMHkP2: "silver",  // $500/mo Foundation → Silver
  price_1TPYXsRxClGX2uTFcMCkSlMo: "gold",    // $750/mo Elite → Gold
  price_1TPYYGRxClGX2uTF7o1v901o: "lifetime", // $2,000 Lifetime
};
