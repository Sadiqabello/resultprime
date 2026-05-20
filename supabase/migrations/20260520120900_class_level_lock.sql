-- ============================================================================
-- 09 · Move the score-lock check to CLASS level
-- ============================================================================
-- Approval is per class + term (one row: subject_type='class', subject_id=class).
-- Submitting a class locks every score sheet in it, so the lock trigger now
-- resolves the class from the edited score's class_subject and checks the
-- class-level approval state. (Replaces the class_subject-keyed check from
-- migration 07.)

create or replace function public.prevent_locked_score_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_state public.approval_state;
  v_class_id uuid;
begin
  select cs.class_id into v_class_id
  from public.class_subjects cs
  where cs.id = new.class_subject_id;

  select a.state into v_state
  from public.approvals a
  where a.school_id = new.school_id
    and a.subject_type = 'class'
    and a.subject_id = v_class_id
    and a.term_id = new.term_id;

  if v_state in ('submitted','l1_approved','approved','published') then
    raise exception 'Scores are locked for this class (state=%); return or unlock before editing.', v_state
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
