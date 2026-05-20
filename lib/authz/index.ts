import {
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from "./permissions";

export * from "./permissions";

/**
 * The authenticated principal, derived from the JWT (app_metadata) — NEVER from
 * request bodies. `schoolId` is the tenant; `roles` may contain several (e.g. a
 * form teacher who also teaches a subject).
 */
export interface AuthContext {
  userId: string;
  schoolId: string | null; // null only for platform super admins
  roles: Role[];
}

/** Capability check: does any of the user's roles grant this permission? */
export function can(ctx: AuthContext, permission: Permission): boolean {
  return ctx.roles.some((role) =>
    ROLE_PERMISSIONS[role]?.includes(permission),
  );
}

export function hasRole(ctx: AuthContext, role: Role): boolean {
  return ctx.roles.includes(role);
}

export function isSuperAdmin(ctx: AuthContext): boolean {
  return ctx.roles.includes("super_admin");
}

/**
 * Assert that a resource belongs to the caller's tenant. The authoritative
 * isolation is RLS in Postgres; this is the application-layer backstop so we
 * fail fast with a clear error instead of returning empty/odd results.
 */
export function assertSameTenant(ctx: AuthContext, resourceSchoolId: string): boolean {
  return isSuperAdmin(ctx) || ctx.schoolId === resourceSchoolId;
}

/**
 * Scope checks below answer "can this role act on THIS target?" — capability
 * (`can`) is necessary but not sufficient for mutations. These are stubs that
 * must query assignments (class_subjects / classes) via a repository. Wire them
 * up in the relevant module services.
 *
 * TODO(scores): isAssignedToClassSubject(ctx, classSubjectId, termId)
 * TODO(form-teacher): isFormTeacherOf(ctx, classId)
 */
export interface ScopeChecks {
  isAssignedToClassSubject(classSubjectId: string, termId: string): Promise<boolean>;
  isFormTeacherOf(classId: string): Promise<boolean>;
}
