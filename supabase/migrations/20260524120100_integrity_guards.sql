-- ============================================================================
-- 15 · Integrity guards: cumulative upsert key, score-component bound, fee term
-- ============================================================================

-- 1) cumulative_results: make the natural key a FULL unique index (matching the
--    scores/results/term_results fix in migration 08). Annual rows are recomputed
--    in place (hard delete+insert / upsert), never soft-deleted, so the partial
--    `where deleted_at is null` predicate served no purpose and blocked PostgREST
--    .upsert() from using it as a conflict target. The repository can now upsert
--    atomically instead of delete+insert (which had a brief race window).
drop index if exists cumulative_results_uidx;
create unique index cumulative_results_uidx
  on public.cumulative_results (school_id, student_id, session_id);

-- 2) assessment_components.max_score must be positive. The service validates it,
--    but the database is the backstop (mirrors scores.score >= 0). A zero/negative
--    component max would make subject totals and obtainable marks meaningless.
alter table public.assessment_components
  drop constraint if exists assessment_components_max_score_check;
alter table public.assessment_components
  add constraint assessment_components_max_score_check check (max_score > 0);

-- 3) fee_status.term_id consistency. An enrollment is already term-scoped
--    (enrollments unique on school_id, student_id, term_id), so the unique key
--    (school_id, enrollment_id) is effectively one fee record per student-per-term.
--    term_id is a denormalised cache used for term-filtered queries; keep it
--    authoritative by always deriving it from the enrollment, so a wrong term_id
--    can never be written and term filters stay correct.
create or replace function public.fee_status_sync_term()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select e.term_id into new.term_id
  from public.enrollments e
  where e.id = new.enrollment_id;
  return new;
end;
$$;

drop trigger if exists fee_status_sync_term on public.fee_status;
create trigger fee_status_sync_term before insert or update on public.fee_status
  for each row execute function public.fee_status_sync_term();
