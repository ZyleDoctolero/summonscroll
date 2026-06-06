
-- enums
create type public.task_type as enum ('habit','daily','todo');
create type public.task_difficulty as enum ('trivial','easy','medium','hard');
create type public.player_class as enum ('none','warrior','mage','rogue','healer');
create type public.task_event_kind as enum ('plus','minus','complete','uncomplete','miss','cron_drift');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  class public.player_class not null default 'none',
  level int not null default 1,
  xp int not null default 0,
  hp int not null default 50,
  max_hp int not null default 50,
  con_stat int not null default 0,
  gold int not null default 0,         -- Spirit Crystals
  gems int not null default 500,       -- Diamonds (starter bundle)
  pact_seals int not null default 0,
  streak int not null default 0,
  last_cron_date date,
  last_login_date date,
  deaths int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.task_type not null,
  title text not null,
  notes text,
  category text,
  difficulty public.task_difficulty not null default 'easy',
  value numeric not null default 0,    -- Habitica-style value (-20..+20-ish), drifts toward red over time
  streak int not null default 0,
  positive_enabled boolean not null default true,
  negative_enabled boolean not null default false,
  schedule_days int[] not null default array[0,1,2,3,4,5,6], -- dailies: 0=Sun..6=Sat
  due_date date,                                              -- todos
  completed boolean not null default false,                   -- todos: done; dailies: done today
  last_completed_at timestamptz,
  last_completed_date date,                                   -- for dailies cron
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_type_idx on public.tasks(user_id, type) where archived = false;

grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (auth.uid() = user_id);

-- task events (audit log + animations)
create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  kind public.task_event_kind not null,
  delta_value numeric not null default 0,
  reward_gold int not null default 0,
  reward_xp int not null default 0,
  reward_gems int not null default 0,
  hp_change int not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index task_events_user_idx on public.task_events(user_id, created_at desc);

grant select, insert on public.task_events to authenticated;
grant all on public.task_events to service_role;
alter table public.task_events enable row level security;

create policy "task_events_select_own" on public.task_events for select to authenticated using (auth.uid() = user_id);
create policy "task_events_insert_own" on public.task_events for insert to authenticated with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- auto profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1), 'Summoner'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
