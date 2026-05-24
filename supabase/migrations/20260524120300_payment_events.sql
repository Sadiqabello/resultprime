-- ============================================================================
-- 17 · Payment-webhook idempotency / audit (Paystack)
-- ============================================================================
-- Paystack retries webhooks (and the callback page can fire alongside a webhook
-- for the same transaction). Applying a `charge.success` extends the paid period
-- from "now", so processing the same payment twice double-extends it. Record each
-- applied payment reference here under a UNIQUE index, so a duplicate insert
-- fails (23505) and the apply path knows to skip. Doubles as a payment audit log.

create table public.payment_events (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid references public.schools(id) on delete cascade,
  provider   text not null default 'paystack',
  reference  text not null,
  event_type text not null,
  amount     numeric(10,2),
  created_at timestamptz not null default now()
);
create unique index payment_events_provider_ref_uidx on public.payment_events(provider, reference);
create index payment_events_school_idx on public.payment_events(school_id, created_at desc);

alter table public.payment_events enable row level security;
-- Written only by the service-role webhook. School admins may read their own.
create policy payment_events_select on public.payment_events for select to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school());
grant select on public.payment_events to authenticated;
grant all on public.payment_events to service_role;
