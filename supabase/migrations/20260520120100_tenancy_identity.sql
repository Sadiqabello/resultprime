-- ============================================================================
-- 01 · Tenancy & identity: schools, settings, users, roles, permissions
-- ============================================================================

-- ─── schools (tenant root — global, no school_id) ───────────────────────────
create table public.schools (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,            -- subdomain key (Phase 2)
  email           text,
  phone           text,
  address         text,
  country         text default 'NG',
  status          school_status not null default 'trial',
  subscription_tier text default 'basic',
  trial_ends_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
comment on table public.schools is 'Tenant root. Every tenant-owned row references this via school_id.';
create index schools_status_idx on public.schools(status) where deleted_at is null;
create trigger schools_set_updated_at before update on public.schools
  for each row execute function public.set_updated_at();

-- ─── school_settings (1:1) ──────────────────────────────────────────────────
create table public.school_settings (
  school_id          uuid primary key references public.schools(id) on delete cascade,
  logo_url           text,
  primary_color      text,
  secondary_color    text,
  timezone           text not null default 'Africa/Lagos',
  locale             text not null default 'en-NG',
  approval_policy    approval_policy not null default 'one_step',
  fee_gating_enabled boolean not null default false,
  feature_flags      jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger school_settings_set_updated_at before update on public.school_settings
  for each row execute function public.set_updated_at();

-- ─── users (mirrors auth.users 1:1 via id; holds app profile + tenant) ───────
create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  school_id    uuid references public.schools(id) on delete cascade,  -- NULL = platform super admin
  full_name    text not null default '',
  email        text,
  phone        text,
  status       text not null default 'active',
  last_login_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
comment on table public.users is 'App-level profile mirroring auth.users. school_id NULL only for platform staff.';
create index users_school_idx on public.users(school_id) where deleted_at is null;
create unique index users_school_email_uidx on public.users(school_id, lower(email))
  where email is not null and deleted_at is null;
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ─── roles / permissions / mappings ─────────────────────────────────────────
create table public.roles (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid references public.schools(id) on delete cascade,  -- NULL = system role
  key        text not null,
  name       text not null,
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);
-- System roles are unique by key; tenant-custom roles unique per school.
create unique index roles_system_key_uidx on public.roles(key) where school_id is null;
create unique index roles_school_key_uidx on public.roles(school_id, key) where school_id is not null;

create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  description text
);

create table public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id    uuid not null references public.users(id) on delete cascade,
  role_id    uuid not null references public.roles(id) on delete cascade,
  school_id  uuid references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index user_roles_school_idx on public.user_roles(school_id);

-- ─── auto-provision public.users on auth signup ─────────────────────────────
-- SECURITY DEFINER so it can write public.users regardless of RLS. school_id is
-- read from invite metadata when present (set by modules/auth on invite).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, full_name, school_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'school_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
