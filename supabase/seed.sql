-- ============================================================================
-- Seed: system roles, permission catalog, and role→permission matrix.
-- Mirrors lib/authz/permissions.ts. Idempotent (safe to re-run / db reset).
-- No student PII — demo data is left commented out at the bottom.
-- ============================================================================

-- ─── permissions ────────────────────────────────────────────────────────────
insert into public.permissions (key, description) values
  ('schools.manage',       'Platform: create/suspend schools'),
  ('billing.manage',       'Platform: manage subscriptions & billing'),
  ('platform.audit.read',  'Platform: read cross-tenant audit'),
  ('school.configure',     'Configure school profile, settings, branding'),
  ('users.manage',         'Manage users in the school'),
  ('roles.manage',         'Manage roles & assignments'),
  ('assignments.manage',   'Assign teachers to class-subjects'),
  ('grading.manage',       'Manage grading systems & schemes'),
  ('templates.manage',     'Manage report templates'),
  ('students.read',        'View students'),
  ('students.write',       'Create/update students'),
  ('staff.read',           'View staff'),
  ('staff.write',          'Create/update staff'),
  ('academics.manage',     'Manage sessions, terms, classes, subjects'),
  ('scores.read',          'View scores'),
  ('scores.write',         'Enter/edit scores'),
  ('results.compute',      'Run the result engine'),
  ('results.read',         'View computed results & broadsheets'),
  ('results.submit',       'Submit results for approval'),
  ('results.approve',      'Approve results'),
  ('results.publish',      'Publish results'),
  ('results.lock',         'Lock/unlock results'),
  ('results.export',       'Export report cards / broadsheets'),
  ('class.remarks.write',  'Write class-teacher/principal remarks'),
  ('attendance.write',     'Record attendance'),
  ('fees.manage',          'Manage fee/result-gate status'),
  ('self.results.read',    'View own (or child) published results')
on conflict (key) do nothing;

-- ─── system roles (school_id NULL, is_system) ───────────────────────────────
insert into public.roles (key, name, is_system, school_id) values
  ('super_admin',    'Super Admin',    true, null),
  ('school_admin',   'School Admin',   true, null),
  ('principal',      'Principal',      true, null),
  ('vice_principal', 'Vice Principal', true, null),
  ('exam_officer',   'Exam Officer',   true, null),
  ('teacher',        'Teacher',        true, null),
  ('form_teacher',   'Form Teacher',   true, null),
  ('student',        'Student',        true, null),
  ('parent',         'Parent',         true, null),
  ('bursary',        'Bursary',        true, null)
on conflict (key) where school_id is null do nothing;

-- ─── role → permission matrix ───────────────────────────────────────────────
-- Helper pattern: map a system role key to a set of permission keys.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.school_id is null and (
  (r.key = 'super_admin'    and p.key in ('schools.manage','billing.manage','platform.audit.read')) or
  (r.key = 'school_admin'   and p.key in ('school.configure','users.manage','roles.manage','assignments.manage','grading.manage','templates.manage','students.read','students.write','staff.read','staff.write','academics.manage','scores.read','results.read','results.lock','results.export','fees.manage')) or
  (r.key = 'principal'      and p.key in ('students.read','staff.read','scores.read','results.read','results.approve','results.publish','results.lock','results.export','class.remarks.write')) or
  (r.key = 'vice_principal' and p.key in ('students.read','staff.read','scores.read','results.read','results.approve','results.export')) or
  (r.key = 'exam_officer'   and p.key in ('students.read','staff.read','academics.manage','grading.manage','scores.read','scores.write','results.compute','results.read','results.submit','results.lock','results.export')) or
  (r.key = 'teacher'        and p.key in ('students.read','scores.read','scores.write','results.submit')) or
  (r.key = 'form_teacher'   and p.key in ('students.read','scores.read','scores.write','results.read','results.submit','class.remarks.write','attendance.write')) or
  (r.key = 'student'        and p.key in ('self.results.read')) or
  (r.key = 'parent'         and p.key in ('self.results.read')) or
  (r.key = 'bursary'        and p.key in ('students.read','results.read','fees.manage'))
)
on conflict do nothing;

-- ─── optional demo tenant (uncomment for local dev; never in production) ─────
-- insert into public.schools (id, name, slug, status)
--   values ('00000000-0000-0000-0000-000000000001','Demo Academy','demo','active')
--   on conflict do nothing;
-- insert into public.school_settings (school_id) values
--   ('00000000-0000-0000-0000-000000000001') on conflict do nothing;
