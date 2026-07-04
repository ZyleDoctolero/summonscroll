-- Task usability catch-up: due times + columns the UI already sends.
-- The remote DB lagged behind local migrations, which broke task creation
-- (inserts included realm_id/element that did not exist). The client now
-- degrades gracefully, but these columns unlock the full feature set.

alter table public.tasks add column if not exists due_time time;
alter table public.tasks add column if not exists element text;

do $$
begin
  if exists (
    select from information_schema.tables
    where table_schema = 'public' and table_name = 'realms'
  ) then
    alter table public.tasks
      add column if not exists realm_id int references public.realms(id) on delete set null;
  else
    alter table public.tasks add column if not exists realm_id int;
  end if;
end $$;
