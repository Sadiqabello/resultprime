-- ============================================================================
-- 18 · Per-student billing: paid-for quota + enforcement trigger (§2.3)
-- ============================================================================
-- Billing moved from flat plans to usage-based pricing (₦100/student/term,
-- ₦300/student/session). A school pays for a number of student slots; that
-- quantity is stored on the subscription and becomes a hard quota when adding
-- students. The app checks it for a friendly message, but the trigger below is
-- the authoritative backstop (mirrors how requireWritableTenant — not the UI —
-- is the real write gate): it makes the cap atomic, immune to races or any
-- creation path that bypasses the service.

alter table public.subscriptions
  add column if not exists students_paid_for integer
    check (students_paid_for is null or students_paid_for >= 0);

-- Backfill: don't let any pre-existing active subscriber suddenly hit the trial
-- cap of 10. Generous default; pre-launch there are realistically none.
update public.subscriptions
  set students_paid_for = 500
  where students_paid_for is null and status = 'active';

-- ─── Quota enforcement trigger ──────────────────────────────────────────────
-- Cap = the school's paid-for slots, else the trial cap (10). Counts the active
-- roster (status='active', not soft-deleted) — the SAME predicate the app uses,
-- so the two never disagree. Blocks the insert that would exceed the cap.
create or replace function public.enforce_student_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  paid integer;
  cap integer;
  current_count integer;
begin
  select s.students_paid_for into paid
    from public.subscriptions s
    where s.school_id = new.school_id;

  -- 10 = TRIAL_STUDENT_CAP in config/plans.ts — keep the two in sync.
  cap := coalesce(paid, 10);

  select count(*) into current_count
    from public.students st
    where st.school_id = new.school_id
      and st.deleted_at is null
      and st.status = 'active';

  if current_count >= cap then
    raise exception 'STUDENT_QUOTA_EXCEEDED: limit is % students', cap
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists students_quota_check on public.students;
create trigger students_quota_check before insert on public.students
  for each row execute function public.enforce_student_quota();
