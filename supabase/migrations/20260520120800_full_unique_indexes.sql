-- ============================================================================
-- 08 · Make score/result natural keys FULL unique indexes (not partial)
-- ============================================================================
-- scores/results/term_results are updated/recomputed in place, never soft-
-- deleted, so the `WHERE deleted_at IS NULL` predicate served no purpose — and
-- PostgREST's upsert (INSERT ... ON CONFLICT) can only infer a NON-partial
-- unique index as its conflict target. Without this, score-sheet saves and
-- result computation (which upsert on these keys) would fail to match a
-- constraint. Recreate them as full unique indexes.

drop index if exists scores_uidx;
create unique index scores_uidx
  on public.scores (school_id, enrollment_id, class_subject_id, assessment_component_id, term_id);

drop index if exists results_uidx;
create unique index results_uidx
  on public.results (school_id, enrollment_id, class_subject_id, term_id);

drop index if exists term_results_uidx;
create unique index term_results_uidx
  on public.term_results (school_id, enrollment_id, term_id);
