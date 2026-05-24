import { describe, it, expect } from "vitest";
import { computeEntitlement, GRACE_DAYS } from "@/lib/entitlement";

const NOW = new Date("2026-05-24T12:00:00Z");
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe("computeEntitlement", () => {
  it("manual suspend/cancel → locked regardless of dates", () => {
    expect(computeEntitlement({ status: "suspended", trialEndsAt: daysFromNow(30), subscription: null }, NOW).access).toBe("locked");
    expect(computeEntitlement({ status: "cancelled", trialEndsAt: null, subscription: null }, NOW).access).toBe("locked");
  });

  it("active trial → full", () => {
    const e = computeEntitlement({ status: "trial", trialEndsAt: daysFromNow(5), subscription: null }, NOW);
    expect(e.access).toBe("full");
    expect(e.state).toBe("trial");
  });

  it("active subscription → full (subscription overrides trial)", () => {
    const e = computeEntitlement(
      { status: "active", trialEndsAt: daysFromNow(-100), subscription: { status: "active", currentPeriodEnd: daysFromNow(200) } },
      NOW,
    );
    expect(e.access).toBe("full");
    expect(e.state).toBe("subscribed");
  });

  it("trial just expired → read_only within grace", () => {
    const e = computeEntitlement({ status: "trial", trialEndsAt: daysFromNow(-1), subscription: null }, NOW);
    expect(e.access).toBe("read_only");
    expect(e.state).toBe("trial_expired");
  });

  it("trial expired past grace → locked", () => {
    const e = computeEntitlement({ status: "trial", trialEndsAt: daysFromNow(-(GRACE_DAYS + 1)), subscription: null }, NOW);
    expect(e.access).toBe("locked");
    expect(e.state).toBe("trial_expired");
  });

  it("subscription period ended → read_only in grace, then locked", () => {
    const inGrace = computeEntitlement(
      { status: "active", trialEndsAt: null, subscription: { status: "active", currentPeriodEnd: daysFromNow(-2) } },
      NOW,
    );
    expect(inGrace.access).toBe("read_only");
    expect(inGrace.state).toBe("past_due");

    const locked = computeEntitlement(
      { status: "active", trialEndsAt: null, subscription: { status: "active", currentPeriodEnd: daysFromNow(-(GRACE_DAYS + 2)) } },
      NOW,
    );
    expect(locked.access).toBe("locked");
  });

  it("legacy school with no trial end and no subscription → full (never auto-lock)", () => {
    const e = computeEntitlement({ status: "trial", trialEndsAt: null, subscription: null }, NOW);
    expect(e.access).toBe("full");
  });

  it("paid-through-future even if sub flagged canceled → full until period end", () => {
    const e = computeEntitlement(
      { status: "active", trialEndsAt: null, subscription: { status: "canceled", currentPeriodEnd: daysFromNow(30) } },
      NOW,
    );
    expect(e.access).toBe("full");
  });
});
