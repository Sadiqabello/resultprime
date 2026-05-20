-- ============================================================================
-- 03 · People: students, guardians, enrollments, staff
-- ============================================================================

create table public.students (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete set null,  -- optional student login
  admission_no     text not null,
  first_name       text not null,
  last_name        text not null,
  other_names      text,
  gender           gender,
  date_of_birth    date,
  photo_url        text,
  status           student_status not null default 'active',
  current_class_id uuid references public.classes(id) on delete set null,  -- convenience cache; enrollments is the truth
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  created_by       uuid references public.users(id) on delete set null,
  updated_by       uuid references public.users(id) on delete set null
);
create unique index students_admission_uidx on public.students(school_id, admission_no) where deleted_at is null;
create index students_school_class_idx on public.students(school_id, current_class_id) where deleted_at is null;
create index students_school_status_idx on public.students(school_id, status) where deleted_at is null;
create unique index students_user_uidx on public.students(user_id) where user_id is not null;
create trigger students_set_updated_at before update on public.students
  for each row execute function public.set_updated_at();

create table public.guardians (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,  -- optional parent login
  full_name  text not null,
  phone      text,
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index guardians_school_idx on public.guardians(school_id) where deleted_at is null;
create index guardians_user_idx on public.guardians(user_id) where user_id is not null;
create trigger guardians_set_updated_at before update on public.guardians
  for each row execute function public.set_updated_at();

create table public.student_guardians (
  student_id   uuid not null references public.students(id) on delete cascade,
  guardian_id  uuid not null references public.guardians(id) on delete cascade,
  school_id    uuid not null references public.schools(id) on delete cascade,
  relationship text,
  is_primary   boolean not null default false,
  primary key (student_id, guardian_id)
);
create index student_guardians_guardian_idx on public.student_guardians(guardian_id);

-- A student's placement in a class for a session/term — the HISTORICAL truth
-- that results bind to (so repeats/transfers keep correct records, §5.3).
create table public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete restrict,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  term_id     uuid not null references public.terms(id) on delete cascade,
  roll_no     int,
  status      enrollment_status not null default 'active',
  enrolled_on date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
comment on table public.enrollments is 'Historical class placement per term. Results reference enrollment_id, not students.current_class_id.';
create unique index enrollments_uidx on public.enrollments(school_id, student_id, term_id) where deleted_at is null;
create index enrollments_class_term_idx on public.enrollments(school_id, class_id, term_id) where deleted_at is null;
create trigger enrollments_set_updated_at before update on public.enrollments
  for each row execute function public.set_updated_at();

create table public.staff (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  user_id       uuid references public.users(id) on delete set null,
  staff_no      text not null,
  full_name     text not null,
  phone         text,
  qualification text,
  status        staff_status not null default 'active',
  is_teaching   boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create unique index staff_no_uidx on public.staff(school_id, staff_no) where deleted_at is null;
create index staff_school_idx on public.staff(school_id) where deleted_at is null;
create trigger staff_set_updated_at before update on public.staff
  for each row execute function public.set_updated_at();
