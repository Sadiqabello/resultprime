/** Subscription plans (§2.3 — tiered by student count). Amounts in major units. */
export interface Plan {
  key: string;
  name: string;
  amount: number; // in NGN (major units); converted to kobo for Paystack
  currency: "NGN";
  interval: "annually" | "termly";
  maxStudents: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    key: "standard",
    name: "Standard",
    amount: 50000,
    currency: "NGN",
    interval: "annually",
    maxStudents: 500,
    features: ["Up to 500 students", "All result & report features", "Email support"],
  },
  {
    key: "pro",
    name: "Pro",
    amount: 150000,
    currency: "NGN",
    interval: "annually",
    maxStudents: 2000,
    features: ["Up to 2,000 students", "Branded subdomain", "Priority support"],
  },
];

export const planByKey = (key: string): Plan | undefined => PLANS.find((p) => p.key === key);
