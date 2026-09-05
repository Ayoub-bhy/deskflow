-- v2: add 'mind' event kind. Run after schema.sql on existing projects.
alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check check (kind in ('move', 'water', 'focus', 'mind'));
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
