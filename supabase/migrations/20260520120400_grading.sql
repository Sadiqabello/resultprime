-- ============================================================================
-- 04 · Grading configuration: grading systems, bands, schemes, components
-- ============================================================================
-- All computation rules live here as DATA, versioned by session/level, so the
-- result engine bends to each school and historical results stay reproducible
-- (§4.3, §6.4). The columns mirror lib/result-engine EngineConfig.

create table public.grading_systems (
  id                        uuid primary key default gen_random_uuid(),
  school_id                 uuid not null references public.schools(id) on delete cascade,
  name                      text not null,
  session_id                uuid references public.sessions(id) on delete cascade,  -- NULL = all sessions
  level                     school_level,                                          -- NULL = all levels
  is_active                 boolean not null default true,
  rounding_dp               smallint not null default 2 check (rounding_dp between 0 and 2),
  tie_strategy              tie_strategy not null default 'standard',
  exclude_absent_from_rank  boolean not null default true,
  pass_mark                 numeric(5,2) not null default 40,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);
create index grading_systems_school_idx on public.grading_systems(school_id) where deleted_at is null;
create trigger grading_systems_set_updated_at before update on public.grading_systems
  for each row execute function public.set_updated_at();

create table public.grade_bands (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,  -- denormalized for simple RLS
  grading_system_id uuid not null references public.grading_systems(id) on delete cascade,
  min_score         numeric(5,2) not null,
  max_score         numeric(5,2) not null,
  grade             text not null,
  remark            text not null default '',
  grade_point       numeric(4,2),
  sort_order        int not null default 0,
  check (min_score <= max_score)
);
create index grade_bands_system_idx on public.grade_bands(grading_system_id);

create table public.assessment_schemes (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  name             text not null,
  session_id       uuid references public.sessions(id) on delete cascade,
  level            school_level,
  total_obtainable numeric(6,2) not null default 100,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index assessment_schemes_school_idx on public.assessment_schemes(school_id) where deleted_at is null;
create trigger assessment_schemes_set_updated_at before update on public.assessment_schemes
  for each row execute function public.set_updated_at();

create table public.assessment_components (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,  -- denormalized for simple RLS
  scheme_id  uuid not null references public.assessment_schemes(id) on delete cascade,
  key        text not null,           -- "ca1" | "ca2" | "exam" ...
  label      text not null,
  max_score  numeric(6,2) not null,
  is_exam    boolean not null default false,
  sort_order int not null default 0
);
create unique index assessment_components_uidx on public.assessment_components(scheme_id, key);
