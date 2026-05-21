-- RAVEN customers (run in Supabase → SQL Editor → Run)

create table if not exists public.raven_users (
  id text primary key,
  name text not null default '',
  email text not null unique,
  phone text default '',
  password text default '',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  orders jsonb not null default '[]'::jsonb
);

alter table public.raven_users enable row level security;

drop policy if exists "raven_users_insert" on public.raven_users;
drop policy if exists "raven_users_select" on public.raven_users;
drop policy if exists "raven_users_update" on public.raven_users;

create policy "raven_users_insert" on public.raven_users for insert with check (true);
create policy "raven_users_select" on public.raven_users for select using (true);
create policy "raven_users_update" on public.raven_users for update using (true);
