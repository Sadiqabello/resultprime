-- ============================================================================
-- 05 · Scores & results (+ append-only score history)
-- ============================================================================

-- Raw input: one row per student × class_subject × component × term.
create table public.scores (
  id                      uuid primary key default gen_random_uuid(),
  school_id               uuid not null references public.schools(id) on delete cascade,
  enrollment_id           uuid not null references public.enrollments(id) on delete cascade,
  class_subject_id        uuid not null references public.class_subjects(id) on delete cascade,
  assessment_component_id uuid not null references public.assessment_components(id) on delete restrict,
  term_id                 uuid not null references public.terms(id) on delete cascade,
  score                   numeric(6,2) check (score >= 0),
  is_absent               boolean not null default false,
  is_exempt               boolean not null default false,
  status                  score_status not null default 'draft',
  entered_by              uuid references public.users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);
create unique index scores_uidx on public.scores(school_id, enrollment_id, class_subject_id, assessment_component_id, term_id) where deleted_at is null;
create index scores_class_subject_idx on public.scores(school_id, class_subject_id, term_id) where deleted_at is null;
create trigger scores_set_updated_at before update on public.scores
  for each row execute function public.set_updated_at();

-- Computed: one row per student × subject × term.
create table public.results (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  enrollment_id    uuid not null references public.enrollments(id) on delete cascade,
  class_subject_id uuid not null references public.class_subjects(id) on delete cascade,
  subject_id       uuid not null references public.subjects(id) on delete cascade,
  term_id          uuid not null references public.terms(id) on delete cascade,
  ca_total         numeric(6,2) not null default 0,
  exam_score       numeric(6,2) not null default 0,
  total            numeric(6,2) not null default 0,
  grade            text,
  grade_point      numeric(4,2),
  remark           text,
  subject_position int,
  subject_count    int,
  is_absent        boolean not null default false,
  config_snapshot  jsonb,                 -- the EngineConfig used → reproducibility
  computed_at      timestamptz,
  status           result_status not null default 'computed',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create unique index results_uidx on public.results(school_id, enrollment_id, class_subject_id, term_id) where deleted_at is null;
create index results_rank_idx on public.results(school_id, class_subject_id, term_id, total desc) where deleted_at is null;
create trigger results_set_updated_at before update on public.results
  for each row execute function public.set_updated_at();

-- Aggregate: one row per student × term (drives the report card header).
create table public.term_results (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references public.schools(id) on delete cascade,
  enrollment_id       uuid not null references public.enrollments(id) on delete cascade,
  class_id            uuid not null references public.classes(id) on delete cascade,
  term_id             uuid not null references public.terms(id) on delete cascade,
  subjects_count      int not null default 0,
  total_obtainable    numeric(8,2) not null default 0,
  total_obtained      numeric(8,2) not null default 0,
  average             numeric(5,2),
  class_position      int,
  class_size          int,
  grade_overall       text,
  attendance_present  int,
  attendance_total    int,
  promotion_status    promotion_status not null default 'na',
  class_teacher_remark text,
  principal_remark    text,
  config_snapshot     jsonb,
  computed_at         timestamptz,
  published_at        timestamptz,
  status              result_status not null default 'computed',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create unique index term_results_uidx on public.term_results(school_id, enrollment_id, term_id) where deleted_at is null;
create index term_results_rank_idx on public.term_results(school_id, class_id, term_id, average desc) where deleted_at is null;
create trigger term_results_set_updated_at before update on public.term_results
  for each row execute function public.set_updated_at();

-- ─── append-only score history (§13.1) ──────────────────────────────────────
create table public.score_history (
  id                      uuid primary key default gen_random_uuid(),
  school_id               uuid not null references public.schools(id) on delete cascade,
  score_id                uuid not null,
  enrollment_id           uuid,
  class_subject_id        uuid,
  assessment_component_id uuid,
  old_value               numeric(6,2),
  new_value               numeric(6,2),
  old_is_absent           boolean,
  new_is_absent           boolean,
  changed_by              uuid,
  reason                  text,
  changed_at              timestamptz not null default now()
);
create index score_history_score_idx on public.score_history(school_id, score_id, changed_at desc);

-- A TRIGGER (not app code) guarantees no path — including bulk import — can
-- change a score without a record. SECURITY DEFINER so the insert always lands.
create or replace function public.record_score_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT'
     or new.score is distinct from old.score
     or new.is_absent is distinct from old.is_absent then
    insert into public.score_history (
      school_id, score_id, enrollment_id, class_subject_id, assessment_component_id,
      old_value, new_value, old_is_absent, new_is_absent, changed_by, changed_at
    ) values (
      new.school_id, new.id, new.enrollment_id, new.class_subject_id, new.assessment_component_id,
      case when tg_op = 'UPDATE' then old.score else null end,
      new.score,
      case when tg_op = 'UPDATE' then old.is_absent else null end,
      new.is_absent, new.entered_by, now()
    );
  end if;
  return new;
end;
$$;

create trigger trg_score_history
  after insert or update on public.scores
  for each row execute function public.record_score_history();
