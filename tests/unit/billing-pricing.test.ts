import { describe, it, expect } from "vitest";
import {
  PRICE_PER_STUDENT,
  TRIAL_STUDENT_CAP,
  priceFor,
  studentCap,
  isBillingPeriod,
} from "@/config/plans";

describe("per-student pricing", () => {
  it("rates are ₦100/term and ₦300/session", () => {
    expect(PRICE_PER_STUDENT.term).toBe(100);
    expect(PRICE_PER_STUDENT.session).toBe(300);
  });

  it("priceFor multiplies the rate by quantity", () => {
    expect(priceFor("term", 1)).toBe(100);
    expect(priceFor("term", 25)).toBe(2_500);
    expect(priceFor("session", 1)).toBe(300);
    expect(priceFor("session", 40)).toBe(12_000);
  });

  it("a session costs exactly three terms", () => {
    expect(priceFor("session", 10)).toBe(priceFor("term", 10) * 3);
  });

  it("isBillingPeriod guards the period union", () => {
    expect(isBillingPeriod("term")).toBe(true);
    expect(isBillingPeriod("session")).toBe(true);
    expect(isBillingPeriod("year")).toBe(false);
    expect(isBillingPeriod(undefined)).toBe(false);
  });
});

describe("studentCap", () => {
  it("uses the paid-for quantity when present", () => {
    expect(studentCap(50)).toBe(50);
    expect(studentCap(1)).toBe(1);
    expect(studentCap(10_000)).toBe(10_000);
  });

  it("falls back to the trial cap when unpaid (null / 0 / undefined)", () => {
    expect(studentCap(null)).toBe(TRIAL_STUDENT_CAP);
    expect(studentCap(undefined)).toBe(TRIAL_STUDENT_CAP);
    expect(studentCap(0)).toBe(TRIAL_STUDENT_CAP);
  });
});
