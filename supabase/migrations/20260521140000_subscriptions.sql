-- ============================================================================
-- 12 · Billing / subscriptions (Phase 6 — §2.3) · Paystack
-- ============================================================================
-- One subscription per school. The payment provider's webhook (authenticated by
-- HMAC signature, not a session) updates this via the service-role client; the
-- app reads it (staff) and starts checkout (school admin). Money in numeric.

create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null unique references public.schools(id) on delete cascade,
  plan               text not null default 'trial',
  status             text not null default 'trialing'
                       check (status in ('trialing', 'active', 'past_due', 'canceled')),
  provider           text not null default 'paystack',
  customer_code      text,
  subscription_code  text,
  amount             numeric(10,2),
  currency           text not null default 'NGN',
  current_period_end timestamptz,
  last_payment_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ─── RLS: staff read own school's billing · school admin manages ─────────────
alter table public.subscriptions enable row level security;

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_staff());
create policy subscriptions_manage on public.subscriptions for all to authenticated
  using (school_id = public.current_school_id() and public.can_manage_school())
  with check (school_id = public.current_school_id() and public.can_manage_school());

grant select, insert, update, delete on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
