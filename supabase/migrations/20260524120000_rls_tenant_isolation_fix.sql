-- ============================================================================
-- 14 · Tenant-isolation hardening for consumer self-read policies
-- ============================================================================
-- The consumer (student/parent) self-read policies on results/term_results/
-- cumulative_results gated only on `status='published'` + `owns_enrollment()`
-- (+ fee gating). `owns_enrollment()` is SECURITY DEFINER and matches the
-- student/guardian by auth.uid() WITHOUT regard to school — so a user who is a
-- guardian in two tenant schools could read the *other* school's rows while
-- authenticated under this tenant's JWT, crossing the tenant boundary the whole
-- model rests on. Add the missing `school_id = current_school_id()` predicate so
-- these reads honour the same invariant as every other policy (§8). Defence in
-- depth: the data is still the user's own child's, but it must never be served
-- under the wrong tenant context.

-- results --------------------------------------------------------------------
drop policy if exists results_select_self on public.results;
create policy results_select_self on public.results for select to authenticated
  using (
    school_id = public.current_school_id()
    and status = 'published'
    and public.owns_enrollment(enrollment_id)
    and public.result_fee_cleared(enrollment_id)
  );

-- term_results ---------------------------------------------------------------
drop policy if exists term_results_select_self on public.term_results;
create policy term_results_select_self on public.term_results for select to authenticated
  using (
    school_id = public.current_school_id()
    and status = 'published'
    and public.owns_enrollment(enrollment_id)
    and public.result_fee_cleared(enrollment_id)
  );

-- cumulative_results ---------------------------------------------------------
-- (No fee gate on the annual rollup today; keep the existing ownership check and
-- add the tenant predicate. Uses student_id ownership, mirroring migration 10.)
drop policy if exists cumulative_results_select_self on public.cumulative_results;
create policy cumulative_results_select_self on public.cumulative_results for select to authenticated
  using (
    school_id = public.current_school_id()
    and status = 'published'
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
