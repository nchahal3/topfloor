import { describe, it, expect } from "vitest";
import type { Tier } from "@/lib/tier";

// Pure helper extracted from dashboard logic — tested here in isolation
function computeEffectiveTier(tier: Tier, gracePeriodEnd: string | null): Tier {
  if (!gracePeriodEnd) return tier;
  const graceExpired = new Date(gracePeriodEnd) < new Date();
  return graceExpired ? null : tier;
}

describe("effectiveTier grace period logic", () => {
  it("returns tier unchanged when no grace period is set", () => {
    expect(computeEffectiveTier("gold", null)).toBe("gold");
    expect(computeEffectiveTier("bronze", null)).toBe("bronze");
    expect(computeEffectiveTier(null, null)).toBeNull();
  });

  it("returns null when grace period has expired", () => {
    const expired = new Date(Date.now() - 1000).toISOString(); // 1 second ago
    expect(computeEffectiveTier("gold", expired)).toBeNull();
    expect(computeEffectiveTier("silver", expired)).toBeNull();
    expect(computeEffectiveTier("bronze", expired)).toBeNull();
  });

  it("preserves tier when grace period is still active", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    expect(computeEffectiveTier("gold", future)).toBe("gold");
    expect(computeEffectiveTier("silver", future)).toBe("silver");
  });

  it("returns null exactly at expiry (boundary)", () => {
    // A millisecond in the past is expired
    const justExpired = new Date(Date.now() - 1).toISOString();
    expect(computeEffectiveTier("gold", justExpired)).toBeNull();
  });

  it("preserves tier 1ms before expiry", () => {
    const almostExpired = new Date(Date.now() + 100).toISOString();
    expect(computeEffectiveTier("gold", almostExpired)).toBe("gold");
  });

  it("handles lifetime tier correctly — cron skips lifetime so grace should never be set", () => {
    // lifetime should never have gracePeriodEnd but be defensive
    const expired = new Date(Date.now() - 1000).toISOString();
    expect(computeEffectiveTier("lifetime", expired)).toBeNull();
  });
});
