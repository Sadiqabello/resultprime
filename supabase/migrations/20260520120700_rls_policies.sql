-- ============================================================================
-- 07 · Row Level Security — tenant isolation + role/scope enforcement (§8)
-- ============================================================================
-- Supabase exposes PostgREST directly to the browser (anon key + user JWT), so
-- a savvy user can hit the tables without going through our server actions.
-- Therefore RLS — not the app service layer — is the authoritative boundary:
--   • tenant isolation: school_id = current_school_id() on every row
--   • consumers (student/parent) get ONLY their own published results
--   • teachers can write scores ONLY for class_subjects assigned to them
-- The service layer is defense in depth on top of this.
--
-- Platform super admins operate via the service-role client (which bypasses
-- RLS), so there are intentionally no super-admin bypass policies here.

-- ─── scope helpers (SECURITY DEFINER: check a relationship, leak nothing) ────
create or replace function public.is_assigned_teacher(p_class_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_subjects cs
    where cs.id = p_class_subject_id
      and cs.teacher_id = auth.uid()
      and cs.deleted_at is null
  )
$$;

create or replace function public.is_form_teacher_of(p_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id
      and c.form_teacher_id = auth.uid()
      and c.deleted_at is null
  )
$$;

-- True when the current user is the student, or a guardian of the student,
-- behind this enrollment. Used to gate consumer access to published results.
create or replace function public.owns_enrollment(p_enrollment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.id = p_enrollment_id
      and (
        s.user_id = auth.uid()
        or exists (
          select 1
          from public.student_guardians sg
          join public.guardians g on g.id = sg.guardian_id
          where sg.student_id = s.id and g.user_id = auth.uid()
        )
      )
  )
$$;

-- ─── enable RLS on every table ──────────────────────────────────────────────
alter table public.schools               enable row level security;
alter table public.school_settings       enable row level security;
alter table public.users                 enable row level security;
alter table public.roles                 enable row level security;
alter table public.permissions           enable row level security;
alter table public.role_permissions      enable row level security;
alter table public.user_roles            enable row level security;
alter table public.sessions              enable row level security;
alter table public.terms                 enable row level security;
alter table public.classes               enable row level security;
alter table public.subjects              enable row level security;
alter table public.class_subjects        enable row level security;
alter table public.students              enable row level security;
alter table public.guardians             enable row level security;
alter table public.student_guardians     enable row level security;
alter table public.enrollments           enable row level security;
alter table public.staff                 enable row level security;
alter table public.grading_systems       enable row level security;
alter table public.grade_bands           enable row level security;
alter table public.assessment_schemes    enable row level security;
alter table public.assessment_components enable row level security;
alter table public.scores                enable row level security;
alter table public.results               enable row level security;
alter table public.term_results          enable row level security;
alter table public.score_history         enable row level security;
alter table public.approvals             enable row level security;
alter table public.approval_events       enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.notifications         enable row level security;

-- ─── schools / settings ─────────────────────────────────────────────────────
create policy schools_select on public.schools for select to authenticated
  using (id = public.current_school_id());
create policy schools_update on public.schools for update to authenticated
  using (id = public.current_school_id() and public.can_manage_school())
  with check (id = public.current_school_id());

create policy school_settings_select on public.school_settings for select to authenticated
  using (school_id = public.current_school_id());
create policy school_settings_insert on public.school_settings for insert to authenticated
  with check (school_id = public.current_school_id() and public.can_manage_school());
create policy school_settings_update on public.school_settings for update to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school())
  with check (school_id = public.current_school_id());

-- ─── users / roles / permissions ────────────────────────────────────────────
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or (school_id = public.current_school_id() and public.is_school_staff()));
create policy users_update_self on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy users_manage on public.users for update to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school())
  with check (school_id = public.current_school_id());

create policy roles_select on public.roles for select to authenticated
  using (school_id is null or school_id = public.current_school_id());
create policy roles_manage on public.roles for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school())
  with check (school_id = public.current_school_id() and public.can_manage_school());

create policy permissions_select on public.permissions for select to authenticated using (true);

create policy role_permissions_select on public.role_permissions for select to authenticated using (true);
create policy role_permissions_manage on public.role_permissions for all to authenticated
  using (public.can_manage_school()
    and exists (select 1 from public.roles r where r.id = role_id and r.school_id = public.current_school_id()))
  with check (public.can_manage_school()
    and exists (select 1 from public.roles r where r.id = role_id and r.school_id = public.current_school_id()));

create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or (school_id = public.current_school_id() and public.is_school_staff()));
create policy user_roles_manage on public.user_roles for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school())
  with check (school_id = public.current_school_id() and public.can_manage_school());

-- ─── academics (staff read · academics managers write) ──────────────────────
create policy sessions_select on public.sessions for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy sessions_manage on public.sessions for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy terms_select on public.terms for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy terms_manage on public.terms for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy classes_select on public.classes for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy classes_manage on public.classes for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy subjects_select on public.subjects for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy subjects_manage on public.subjects for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy class_subjects_select on public.class_subjects for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy class_subjects_manage on public.class_subjects for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

-- ─── people (staff read+manage · consumers read own) ────────────────────────
create policy students_select_staff on public.students for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy students_select_self on public.students for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.student_guardians sg
      join public.guardians g on g.id = sg.guardian_id
      where sg.student_id = students.id and g.user_id = auth.uid()
    )
  );
create policy students_manage on public.students for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy guardians_select on public.guardians for select to authenticated
  using ((school_id = public.current_school_id() and public.is_school_staff()) or user_id = auth.uid());
create policy guardians_manage on public.guardians for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy student_guardians_select on public.student_guardians for select to authenticated
  using (
    (school_id = public.current_school_id() and public.is_school_staff())
    or exists (select 1 from public.guardians g where g.id = guardian_id and g.user_id = auth.uid())
  );
create policy student_guardians_manage on public.student_guardians for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy enrollments_select_staff on public.enrollments for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy enrollments_select_self on public.enrollments for select to authenticated
  using (public.owns_enrollment(id));
create policy enrollments_manage on public.enrollments for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy staff_select on public.staff for select to authenticated
  using ((school_id = public.current_school_id() and public.is_school_staff()) or user_id = auth.uid());
create policy staff_manage on public.staff for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school())
  with check (school_id = public.current_school_id() and public.can_manage_school());

-- ─── grading config (staff read · academics managers write) ─────────────────
create policy grading_systems_select on public.grading_systems for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy grading_systems_manage on public.grading_systems for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy grade_bands_select on public.grade_bands for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy grade_bands_manage on public.grade_bands for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy assessment_schemes_select on public.assessment_schemes for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy assessment_schemes_manage on public.assessment_schemes for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

create policy assessment_components_select on public.assessment_components for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy assessment_components_manage on public.assessment_components for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_academics())
  with check (school_id = public.current_school_id() and public.can_manage_academics());

-- ─── scores: assignment-scoped writes ───────────────────────────────────────
create policy scores_select on public.scores for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy scores_insert on public.scores for insert to authenticated
  with check (
    school_id = public.current_school_id()
    and (public.can_manage_results() or public.is_assigned_teacher(class_subject_id))
  );
create policy scores_update on public.scores for update to authenticated
  using (
    school_id = public.current_school_id()
    and (public.can_manage_results() or public.is_assigned_teacher(class_subject_id))
  )
  with check (
    school_id = public.current_school_id()
    and (public.can_manage_results() or public.is_assigned_teacher(class_subject_id))
  );
create policy scores_delete on public.scores for delete to authenticated
  using (school_id = public.current_school_id() and public.can_manage_results());

-- ─── results / term_results: managers write · consumers read own published ──
create policy results_select_staff on public.results for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy results_select_self on public.results for select to authenticated
  using (status = 'published' and public.owns_enrollment(enrollment_id));
create policy results_manage on public.results for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_results())
  with check (school_id = public.current_school_id() and public.can_manage_results());

create policy term_results_select_staff on public.term_results for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy term_results_select_self on public.term_results for select to authenticated
  using (status = 'published' and public.owns_enrollment(enrollment_id));
create policy term_results_manage on public.term_results for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_results())
  with check (school_id = public.current_school_id() and public.can_manage_results());

-- ─── score_history: read-only to staff (writes only via the DEFINER trigger) ─
create policy score_history_select on public.score_history for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());

-- ─── workflow & audit ───────────────────────────────────────────────────────
-- Transition AUTHORIZATION (who may submit vs approve vs publish) is enforced by
-- the approvals state machine in the service layer; RLS keeps it tenant-scoped.
create policy approvals_select on public.approvals for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy approvals_insert on public.approvals for insert to authenticated
  with check (school_id = public.current_school_id() and public.is_school_staff());
create policy approvals_update on public.approvals for update to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff())
  with check (school_id = public.current_school_id() and public.is_school_staff());

create policy approval_events_select on public.approval_events for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy approval_events_insert on public.approval_events for insert to authenticated
  with check (school_id = public.current_school_id() and public.is_school_staff() and actor_id = auth.uid());

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (
    school_id = public.current_school_id()
    and (public.can_manage_school() or public.has_any_role(array['principal','vice_principal','exam_officer']))
  );
create policy audit_logs_insert on public.audit_logs for insert to authenticated
  with check (school_id = public.current_school_id() and actor_id = auth.uid());

create policy notifications_select on public.notifications for select to authenticated
  using (recipient_user_id = auth.uid() or (school_id = public.current_school_id() and public.can_manage_school()));
create policy notifications_insert on public.notifications for insert to authenticated
  with check (school_id = public.current_school_id() and public.is_school_staff());
create policy notifications_update_own on public.notifications for update to authenticated
  using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

-- ─── result locking: block score edits once submitted/approved/published ────
-- Enforced as a trigger (not RLS) because it depends on the approval state of a
-- DIFFERENT row. Authorized corrections must first RETURN/unlock the approval.
create or replace function public.prevent_locked_score_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_state public.approval_state;
begin
  select a.state into v_state
  from public.approvals a
  where a.school_id = new.school_id
    and a.subject_type = 'class_subject_result'
    and a.subject_id = new.class_subject_id
    and a.term_id = new.term_id;

  if v_state in ('submitted','l1_approved','approved','published') then
    raise exception 'Scores are locked for this class-subject (state=%); return or unlock before editing.', v_state
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_locked_score_change
  before insert or update on public.scores
  for each row execute function public.prevent_locked_score_change();

-- ─── grants (RLS still governs row visibility; anon gets no table access) ────
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;
