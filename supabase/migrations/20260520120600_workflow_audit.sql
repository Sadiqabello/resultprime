-- ============================================================================
-- 06 · Workflow & audit: approvals, approval_events, audit_logs, notifications
-- ============================================================================

-- One state-machine instance per approvable thing (§6.7). subject_id points at
-- a class_subject / class / enrollment depending on subject_type.
create table public.approvals (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  subject_type approval_subject_type not null,
  subject_id   uuid not null,
  term_id      uuid not null references public.terms(id) on delete cascade,
  state        approval_state not null default 'draft',
  submitted_by uuid references public.users(id) on delete set null,
  submitted_at timestamptz,
  approved_by  uuid references public.users(id) on delete set null,
  approved_at  timestamptz,
  published_at timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index approvals_uidx on public.approvals(school_id, subject_type, subject_id, term_id);
create index approvals_lookup_idx on public.approvals(school_id, term_id, state);
create trigger approvals_set_updated_at before update on public.approvals
  for each row execute function public.set_updated_at();

-- Immutable transition log (append-only; no update/delete policy).
create table public.approval_events (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  approval_id uuid not null references public.approvals(id) on delete cascade,
  from_state  approval_state,
  to_state    approval_state not null,
  actor_id    uuid references public.users(id) on delete set null,
  actor_role  text,
  comment     text,
  created_at  timestamptz not null default now()
);
create index approval_events_idx on public.approval_events(approval_id, created_at);

-- System-wide activity log (§13.3). Append-only.
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid references public.schools(id) on delete cascade,
  actor_id    uuid references public.users(id) on delete set null,
  actor_role  text,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index audit_logs_school_time_idx on public.audit_logs(school_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(school_id, entity_type, entity_id);

create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,
  recipient_user_id uuid references public.users(id) on delete cascade,
  channel           notification_channel not null default 'in_app',
  type              text not null,
  payload           jsonb not null default '{}'::jsonb,
  status            notification_status not null default 'pending',
  sent_at           timestamptz,
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_user_id, created_at desc);
