-- DeskFlow schema. Run once in Supabase → SQL Editor.

-- One row per user: settings + rolling 30-day history.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  settings    jsonb,
  history     jsonb,
  updated_at  timestamptz not null default now()
);

-- Append-only activity log (one row per "I moved" / "I drank" / completed focus block).
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('move', 'water', 'focus', 'mind')),
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_user_created_idx on public.events (user_id, created_at desc);

-- Row Level Security: users can only touch their own rows.
alter table public.profiles enable row level security;
alter table public.events   enable row level security;

drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row" on public.profiles
  for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "events: insert own" on public.events;
create policy "events: insert own" on public.events
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "events: read own" on public.events;
create policy "events: read own" on public.events
  for select to authenticated using (auth.uid() = user_id);

-- Handy view for your own dashboards (per user, per day totals).
create or replace view public.daily_totals
  with (security_invoker = true) as
select user_id,
       (created_at at time zone 'utc')::date as day,
       count(*) filter (where kind = 'move')  as moves,
       count(*) filter (where kind = 'water') as water,
       count(*) filter (where kind = 'focus') as focus,
       count(*) filter (where kind = 'mind')  as mind
from public.events
group by 1, 2;
