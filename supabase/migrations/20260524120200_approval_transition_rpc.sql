-- ============================================================================
-- 16 · Atomic approval transition (publish) in one transaction
-- ============================================================================
-- Advancing a class approval — especially PUBLISH — touches several tables:
-- the approval row, the append-only event log, and (on publish) every subject
-- result + the term result for the class. Done as separate statements from the
-- app, a partial failure could advance the approval state while leaving results
-- invisible. This function performs all writes in ONE transaction (functions are
-- atomic), so the workflow can never end up half-applied.
--
-- SECURITY INVOKER (default): it runs in the caller's RLS context, so tenant
-- isolation + role policies still apply as a backstop. The state-machine
-- validation and capability checks live in the service layer (the only caller).
-- Notifications stay OUTSIDE this function (best-effort external side effect).

create or replace function public.apply_approval_transition(
  p_school_id  uuid,
  p_class_id   uuid,
  p_term_id    uuid,
  p_to         public.approval_state,
  p_from       public.approval_state,
  p_actor_id   uuid,
  p_actor_role text
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_approval_id uuid;
  v_now timestamptz := now();
begin
  insert into public.approvals (
    school_id, subject_type, subject_id, term_id, state,
    submitted_by, submitted_at, approved_by, approved_at, published_at
  )
  values (
    p_school_id, 'class', p_class_id, p_term_id, p_to,
    case when p_to = 'submitted' then p_actor_id end,
    case when p_to = 'submitted' then v_now end,
    case when p_to = 'approved'  then p_actor_id end,
    case when p_to = 'approved'  then v_now end,
    case when p_to = 'published' then v_now end
  )
  on conflict (school_id, subject_type, subject_id, term_id) do update
    set state        = excluded.state,
        submitted_by = coalesce(excluded.submitted_by, public.approvals.submitted_by),
        submitted_at = coalesce(excluded.submitted_at, public.approvals.submitted_at),
        approved_by  = coalesce(excluded.approved_by,  public.approvals.approved_by),
        approved_at  = coalesce(excluded.approved_at,  public.approvals.approved_at),
        published_at = coalesce(excluded.published_at, public.approvals.published_at)
  returning id into v_approval_id;

  insert into public.approval_events (school_id, approval_id, from_state, to_state, actor_id, actor_role)
  values (p_school_id, v_approval_id, p_from, p_to, p_actor_id, p_actor_role);

  if p_to = 'published' then
    update public.results r
      set status = 'published'
      where r.school_id = p_school_id
        and r.term_id   = p_term_id
        and r.class_subject_id in (
          select cs.id from public.class_subjects cs
          where cs.school_id = p_school_id
            and cs.class_id  = p_class_id
            and cs.term_id   = p_term_id
            and cs.deleted_at is null
        );

    update public.term_results tr
      set status = 'published', published_at = v_now
      where tr.school_id = p_school_id
        and tr.class_id  = p_class_id
        and tr.term_id   = p_term_id;
  end if;
end;
$$;

grant execute on function public.apply_approval_transition(
  uuid, uuid, uuid, public.approval_state, public.approval_state, uuid, text
) to authenticated, service_role;
