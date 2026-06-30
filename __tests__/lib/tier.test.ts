import { describe, it, expect } from "vitest";
import { hasAccess, PRICE_TIER, TIER_LABELS, TIER_COLORS } from "@/lib/tier";
import type { Tier } from "@/lib/tier";

describe("hasAccess", () => {
  it("returns true when no tier is required (free content)", () => {
    expect(hasAccess(null, null)).toBe(true);
    expect(hasAccess("bronze", null)).toBe(true);
    expect(hasAccess("gold", null)).toBe(true);
  });

  it("returns false when content requires a tier but user has none", () => {
    expect(hasAccess(null, "bronze")).toBe(false);
    expect(hasAccess(null, "gold")).toBe(false);
    expect(hasAccess(null, "lifetime")).toBe(false);
  });

  it("grants access when user tier exactly matches required tier", () => {
    expect(hasAccess("bronze", "bronze")).toBe(true);
    expect(hasAccess("silver", "silver")).toBe(true);
    expect(hasAccess("gold", "gold")).toBe(true);
    expect(hasAccess("lifetime", "lifetime")).toBe(true);
  });

  it("grants access when user tier is higher than required tier", () => {
    expect(hasAccess("silver", "bronze")).toBe(true);
    expect(hasAccess("gold", "bronze")).toBe(true);
    expect(hasAccess("gold", "silver")).toBe(true);
    expect(hasAccess("lifetime", "bronze")).toBe(true);
    expect(hasAccess("lifetime", "gold")).toBe(true);
  });

  it("denies access when user tier is lower than required tier", () => {
    expect(hasAccess("bronze", "silver")).toBe(false);
    expect(hasAccess("bronze", "gold")).toBe(false);
    expect(hasAccess("silver", "gold")).toBe(false);
    expect(hasAccess("bronze", "lifetime")).toBe(false);
    expect(hasAccess("gold", "lifetime")).toBe(false);
  });
});

describe("PRICE_TIER", () => {
  it("maps all live price IDs to correct tiers", () => {
    expect(PRICE_TIER["price_1TiphA8U0Yle7MZgUELrqhSV"]).toBe("bronze");
    expect(PRICE_TIER["price_1TiphA8U0Yle7MZggKFKtsl8"]).toBe("silver");
    expect(PRICE_TIER["price_1TiphA8U0Yle7MZgkmDxN3lZ"]).toBe("gold");
    expect(PRICE_TIER["price_1TiphC8U0Yle7MZg1ivchT6j"]).toBe("lifetime");
  });

  it("maps all test price IDs to correct tiers", () => {
    expect(PRICE_TIER["price_1TiikP8sHKVNeGWtxjodurtl"]).toBe("bronze");
    expect(PRICE_TIER["price_1Tiike8sHKVNeGWtJr1gxDZx"]).toBe("silver");
    expect(PRICE_TIER["price_1Tiiku8sHKVNeGWtthSeTog0"]).toBe("gold");
    expect(PRICE_TIER["price_1Tiil68sHKVNeGWt4SFHY6P5"]).toBe("lifetime");
  });

  it("returns undefined for unknown price IDs", () => {
    expect(PRICE_TIER["price_unknown"]).toBeUndefined();
  });
});

describe("TIER_LABELS", () => {
  it("has labels for all tiers", () => {
    expect(TIER_LABELS["bronze"]).toBe("Bronze");
    expect(TIER_LABELS["silver"]).toBe("Silver");
    expect(TIER_LABELS["gold"]).toBe("Gold");
    expect(TIER_LABELS["lifetime"]).toBe("Lifetime");
  });
});

describe("TIER_COLORS", () => {
  it("has distinct colors for all tiers", () => {
    const colors = Object.values(TIER_COLORS);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});
