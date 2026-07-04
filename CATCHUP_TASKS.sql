-- ============================================================
-- SummonScroll — task system catch-up SQL
-- Paste this whole file into the Supabase Dashboard SQL editor
-- (Dashboard -> SQL Editor -> New query -> Run).
--
-- Why: the live database is missing columns the task UI uses.
-- Task creation used to FAIL because of this. The app now works
-- without these columns, but running this unlocks:
--   * due_time  -> "do this at 7:00 AM" on duties and hunts
--   * element   -> element tags on tasks (Ritual Incubation)
--   * realm_id  -> realm affinity on tasks
-- Safe to run multiple times (everything is IF NOT EXISTS).
-- ============================================================

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

-- Ask PostgREST to reload its schema cache so the new columns
-- are usable immediately without restarting anything.
notify pgrst, 'reload schema';
