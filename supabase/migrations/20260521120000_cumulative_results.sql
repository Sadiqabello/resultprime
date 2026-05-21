-- ============================================================================
-- 10 · Cumulative / annual results (Phase 5 — §2.2, §6)
-- ============================================================================
-- Annual rollup across a session's terms: one row per student × session with a
-- cumulative average, annual position, and a promotion decision. Term results
-- stay the source of truth; this is a derived, recomputable aggregate (like
-- term_results), so it carries the same status + config snapshot for audit.

create table public.cumulative_results (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references public.schools(id) on delete cascade,
  student_id         uuid not null references public.students(id) on delete cascade,
  class_id           uuid not null references public.classes(id) on delete cascade,   -- class at end of session
  session_id         uuid not null references public.sessions(id) on delete cascade,
  terms_count        int not null default 0,
  cumulative_average numeric(5,2),
  annual_position    int,
  class_size         int,
  promotion_status   promotion_status not null default 'na',
  next_class_id      uuid references public.classes(id) on delete set null,           -- proposed promotion target
  config_snapshot    jsonb,
  computed_at        timestamptz,
  status             result_status not null default 'computed',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create unique index cumulative_results_uidx
  on public.cumulative_results(school_id, student_id, session_id) where deleted_at is null;
create index cumulative_results_rank_idx
  on public.cumulative_results(school_id, class_id, session_id, cumulative_average desc) where deleted_at is null;
create trigger cumulative_results_set_updated_at before update on public.cumulative_results
  for each row execute function public.set_updated_at();

-- ─── RLS: staff read · managers write · consumers read own published ─────────
alter table public.cumulative_results enable row level security;

create policy cumulative_results_select_staff on public.cumulative_results for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());

create policy cumulative_results_select_self on public.cumulative_results for select to authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.students s
      where s.id = cumulative_results.student_id
        and (
          s.user_id = auth.uid()
          or exists (
            select 1 from public.student_guardians sg
            join public.guardians g on g.id = sg.guardian_id
            where sg.student_id = s.id and g.user_id = auth.uid()
          )
        )
    )
  );

create policy cumulative_results_manage on public.cumulative_results for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_results())
  with check (school_id = public.current_school_id() and public.can_manage_results());

-- New table needs explicit grants (migration 07's blanket grant predates it; RLS
-- still governs which rows are visible).
grant select, insert, update, delete on public.cumulative_results to authenticated;
grant all on public.cumulative_results to service_role;
