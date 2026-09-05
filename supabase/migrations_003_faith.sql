-- v5: faith kinds ('dhikr', 'prayer') in the events table.
alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check check (kind in ('move', 'water', 'focus', 'mind', 'dhikr', 'prayer'));
