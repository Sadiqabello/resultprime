-- ============================================================================
-- 13 · Affective/psychomotor traits (§2.2) + report-card signature (§11.5)
-- ============================================================================

-- A school's configurable behavioural traits (e.g. Punctuality, Neatness).
create table public.trait_definitions (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  name       text not null,
  category   text not null default 'affective' check (category in ('affective', 'psychomotor')),
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index trait_definitions_uidx on public.trait_definitions(school_id, lower(name));
create index trait_definitions_school_idx on public.trait_definitions(school_id);
create trigger trait_definitions_set_updated_at before update on public.trait_definitions
  for each row execute function public.set_updated_at();

alter table public.trait_definitions enable row level security;
create policy trait_definitions_select on public.trait_definitions for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy trait_definitions_manage on public.trait_definitions for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());
grant select, insert, update, delete on public.trait_definitions to authenticated;
grant all on public.trait_definitions to service_role;

-- Per-student trait ratings snapshot (rendered on the report card).
alter table public.term_results add column if not exists traits jsonb;

-- Principal signature image (shown on published report cards).
alter table public.school_settings add column if not exists principal_signature_url text;
