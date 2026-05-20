-- ============================================================================
-- 00 · Foundation: extensions, enum types, shared trigger + JWT/RLS helpers
-- ============================================================================
-- The helper functions here are the backbone of Row Level Security (§8 of the
-- plan): they read the tenant (school_id) and roles from the JWT's app_metadata,
-- which is set server-side at provisioning and is NOT user-editable. Every RLS
-- policy is expressed in terms of these helpers.

create extension if not exists pgcrypto;

-- ─── Enum types ─────────────────────────────────────────────────────────────
create type school_status         as enum ('trial','active','suspended','cancelled');
create type approval_policy        as enum ('one_step','two_step');
create type school_level           as enum ('primary','junior_secondary','senior_secondary');
create type gender                 as enum ('male','female');
create type student_status         as enum ('active','graduated','withdrawn','transferred');
create type enrollment_status      as enum ('active','left');
create type staff_status           as enum ('active','inactive','suspended');
create type subject_category       as enum ('core','elective');
create type score_status           as enum ('draft','submitted');
create type result_status          as enum ('computed','published');
create type approval_state         as enum ('draft','submitted','l1_approved','approved','published','returned');
create type approval_subject_type  as enum ('class_subject_result','term_result','class');
create type promotion_status       as enum ('promoted','repeat','pending','na');
create type notification_channel   as enum ('in_app','email','sms','whatsapp');
create type notification_status    as enum ('pending','sent','failed','read');
create type tie_strategy           as enum ('dense','standard');

-- ─── updated_at maintenance ───────────────────────────────────────────────--
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── JWT helpers: read tenant + roles from app_metadata ─────────────────────-
create or replace function public.current_school_id()
returns uuid language sql stable as $$
  select nullif(coalesce(auth.jwt() -> 'app_metadata' ->> 'school_id', ''), '')::uuid
$$;

create or replace function public.current_user_roles()
returns text[] language sql stable as $$
  select coalesce(
    array(
      select jsonb_array_elements_text(
        coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)
      )
    ),
    '{}'::text[]
  )
$$;

create or replace function public.has_any_role(p_roles text[])
returns boolean language sql stable as $$
  select public.current_user_roles() && p_roles
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$
  select 'super_admin' = any(public.current_user_roles())
$$;

-- True for any staff role (everyone except students/parents and the platform
-- super admin). Consumers (student/parent) are deliberately excluded so they
-- can never reach config/people/score tables — only their own published results.
create or replace function public.is_school_staff()
returns boolean language sql stable as $$
  select public.has_any_role(array[
    'school_admin','principal','vice_principal','exam_officer',
    'teacher','form_teacher','bursary'
  ])
$$;

create or replace function public.can_manage_school()
returns boolean language sql stable as $$
  select public.has_any_role(array['school_admin'])
$$;

create or replace function public.can_manage_academics()
returns boolean language sql stable as $$
  select public.has_any_role(array['school_admin','exam_officer'])
$$;

create or replace function public.can_manage_results()
returns boolean language sql stable as $$
  select public.has_any_role(array['school_admin','exam_officer','principal','vice_principal'])
$$;
