-- ============================================================================
-- 11 · Bursary fee-gating (Phase 5 — §2.2, §3.2 Bursary)
-- ============================================================================
-- The bursar records each student's fee clearance per term. When a school turns
-- on fee gating (school_settings.fee_gating_enabled), consumers (students/
-- parents) may only SEE their published results once fees are cleared — enforced
-- in RLS so it cannot be bypassed. Staff are never gated.

create table public.fee_status (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  term_id       uuid not null references public.terms(id) on delete cascade,
  status        text not null default 'owing' check (status in ('cleared', 'owing', 'partial')),
  note          text,
  updated_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- FULL unique index (not partial) so PostgREST .upsert() can use it as a conflict target.
create unique index fee_status_uidx on public.fee_status(school_id, enrollment_id);
create index fee_status_term_idx on public.fee_status(school_id, term_id);
create trigger fee_status_set_updated_at before update on public.fee_status
  for each row execute function public.set_updated_at();

-- ─── RLS: bursar/admin manage · staff + owner read ──────────────────────────
alter table public.fee_status enable row level security;

create policy fee_status_select on public.fee_status for select to authenticated
  using (
    (school_id = public.current_school_id() and public.is_school_staff())
    or public.owns_enrollment(enrollment_id)
  );
create policy fee_status_manage on public.fee_status for all to authenticated
  using (school_id = public.current_school_id() and public.has_any_role(array['bursary', 'school_admin']))
  with check (school_id = public.current_school_id() and public.has_any_role(array['bursary', 'school_admin']));

grant select, insert, update, delete on public.fee_status to authenticated;
grant all on public.fee_status to service_role;

-- ─── the gate: cleared unless the school gates fees AND this enrolment isn't cleared
create or replace function public.result_fee_cleared(p_enrollment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when not coalesce(
      (select ss.fee_gating_enabled
         from public.enrollments e
         join public.school_settings ss on ss.school_id = e.school_id
        where e.id = p_enrollment_id),
      false)
    then true  -- school doesn't gate → always visible
    else exists (
      select 1 from public.fee_status fs
      where fs.enrollment_id = p_enrollment_id and fs.status = 'cleared'
    )
  end
$$;

-- ─── apply the gate to consumer self-reads (staff policies are untouched) ────
drop policy if exists term_results_select_self on public.term_results;
create policy term_results_select_self on public.term_results for select to authenticated
  using (
    status = 'published'
    and public.owns_enrollment(enrollment_id)
    and public.result_fee_cleared(enrollment_id)
  );

drop policy if exists results_select_self on public.results;
create policy results_select_self on public.results for select to authenticated
  using (
    status = 'published'
    and public.owns_enrollment(enrollment_id)
    and public.result_fee_cleared(enrollment_id)
  );
