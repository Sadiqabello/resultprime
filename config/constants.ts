/** App-wide constants and enum-like unions shared across modules. */

export const APPROVAL_STATES = [
  "draft",
  "submitted",
  "l1_approved",
  "approved",
  "published",
  "returned",
] as const;
export type ApprovalState = (typeof APPROVAL_STATES)[number];

export const PROMOTION_STATUS = ["promoted", "repeat", "pending", "na"] as const;
export type PromotionStatus = (typeof PROMOTION_STATUS)[number];

export const SCHOOL_LEVELS = [
  "primary",
  "junior_secondary",
  "senior_secondary",
] as const;
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

export const TIE_STRATEGIES = ["dense", "standard"] as const;
export type TieStrategy = (typeof TIE_STRATEGIES)[number];

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/** Header set by middleware after resolving the tenant from subdomain (Phase 2). */
export const TENANT_HEADER = "x-school-id";
export const TENANT_SLUG_HEADER = "x-school-slug";
