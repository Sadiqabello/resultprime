/**
 * Canonical permission keys and the role → permission mapping from §3.2 of the
 * plan. Kept here as the typed source of truth for the app; the same matrix is
 * persisted in the `role_permissions` table for RLS and future custom roles.
 *
 * Capability checks answer "can this role do this action?". They are NOT enough
 * on their own — mutations also require an assignment/scope check (see lib/authz).
 */

export const ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "exam_officer",
  "teacher",
  "form_teacher",
  "student",
  "parent",
  "bursary",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  // platform
  "schools.manage",
  "billing.manage",
  "platform.audit.read",
  // school config
  "school.configure",
  "users.manage",
  "roles.manage",
  "assignments.manage",
  "grading.manage",
  "templates.manage",
  // academics & people
  "students.read",
  "students.write",
  "staff.read",
  "staff.write",
  "academics.manage",
  // scores & results
  "scores.read",
  "scores.write",
  "results.compute",
  "results.read",
  "results.submit",
  "results.approve",
  "results.publish",
  "results.lock",
  "results.export",
  // class teacher duties
  "class.remarks.write",
  "attendance.write",
  // fees / gating
  "fees.manage",
  // consumer
  "self.results.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Role → granted permissions. `◇` (configurable) cases default to the common policy. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ["schools.manage", "billing.manage", "platform.audit.read"],
  school_admin: [
    "school.configure",
    "users.manage",
    "roles.manage",
    "assignments.manage",
    "grading.manage",
    "templates.manage",
    "students.read",
    "students.write",
    "staff.read",
    "staff.write",
    "academics.manage",
    "scores.read",
    "results.read",
    "results.lock",
    "results.export",
    "fees.manage",
  ],
  principal: [
    "students.read",
    "staff.read",
    "scores.read",
    "results.read",
    "results.approve",
    "results.publish",
    "results.lock",
    "results.export",
    "class.remarks.write",
  ],
  vice_principal: [
    "students.read",
    "staff.read",
    "scores.read",
    "results.read",
    "results.approve", // level-1 approval; publish reserved for principal by policy
    "results.export",
  ],
  exam_officer: [
    "students.read",
    "staff.read",
    "academics.manage",
    "grading.manage",
    "scores.read",
    "scores.write",
    "results.compute",
    "results.read",
    "results.submit",
    "results.lock",
    "results.export",
  ],
  teacher: ["students.read", "scores.read", "scores.write", "results.submit"],
  form_teacher: [
    "students.read",
    "scores.read",
    "scores.write",
    "results.read",
    "results.submit",
    "class.remarks.write",
    "attendance.write",
  ],
  student: ["self.results.read"],
  parent: ["self.results.read"],
  bursary: ["students.read", "results.read", "fees.manage"],
};
