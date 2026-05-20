-- ============================================================================
-- 02 · Academic structure: sessions, terms, classes, subjects, class_subjects
-- ============================================================================

create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  name       text not null,                  -- e.g. "2025/2026"
  starts_on  date,
  ends_on    date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sessions_school_idx on public.sessions(school_id) where deleted_at is null;
-- At most one current session per school.
create unique index sessions_current_uidx on public.sessions(school_id) where is_current and deleted_at is null;
create unique index sessions_school_name_uidx on public.sessions(school_id, name) where deleted_at is null;
create trigger sessions_set_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();

create table public.terms (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  name       text not null,                  -- "First" | "Second" | "Third"
  sequence   smallint not null check (sequence between 1 and 6),
  starts_on  date,
  ends_on    date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index terms_school_session_idx on public.terms(school_id, session_id) where deleted_at is null;
create unique index terms_current_uidx on public.terms(school_id) where is_current and deleted_at is null;
create unique index terms_session_seq_uidx on public.terms(session_id, sequence) where deleted_at is null;
create trigger terms_set_updated_at before update on public.terms
  for each row execute function public.set_updated_at();

create table public.classes (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools(id) on delete cascade,
  name            text not null,             -- e.g. "JSS1"
  level           school_level not null,
  arm             text,                      -- e.g. "A" / "Gold"
  grade_order     smallint not null default 0,  -- for promotion ordering
  form_teacher_id uuid references public.users(id) on delete set null,
  next_class_id   uuid references public.classes(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index classes_school_idx on public.classes(school_id) where deleted_at is null;
create index classes_school_grade_idx on public.classes(school_id, grade_order) where deleted_at is null;
create trigger classes_set_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

create table public.subjects (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,
  name              text not null,
  code              text not null,
  category          subject_category not null default 'core',
  applies_to_levels school_level[] not null default array[]::school_level[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create unique index subjects_school_code_uidx on public.subjects(school_id, code) where deleted_at is null;
create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

-- which subject is offered in which class, in which term, by which teacher.
-- The teacher_id here is what scopes a teacher's score-entry access (RLS).
create table public.class_subjects (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  class_id   uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term_id    uuid not null references public.terms(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index class_subjects_uidx on public.class_subjects(school_id, class_id, subject_id, term_id) where deleted_at is null;
create index class_subjects_teacher_idx on public.class_subjects(school_id, teacher_id, term_id) where deleted_at is null;
create trigger class_subjects_set_updated_at before update on public.class_subjects
  for each row execute function public.set_updated_at();
