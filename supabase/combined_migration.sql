
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
-- SummonScroll Gacha System: Realms, Monsters, Banners, Pulls
-- Aligned with FR02 & FR03 prompt specifications

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.monster_rarity as enum (
  'common','uncommon','rare','elite','epic','legendary','mythic','ex'
);

create type public.monster_role as enum (
  'attacker','tank','healer','support','debuffer'
);

create type public.banner_type as enum (
  'standard','featured','streak','pact_seal','event'
);

create type public.pull_currency as enum (
  'gems','pact_seals'
);

-- ─── Realms ─────────────────────────────────────────────────────────────────

create table public.realms (
  id serial primary key,
  name text not null unique,
  element text not null,
  habit_affinity text not null,
  description text,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.realms to authenticated;
grant all on public.realms to service_role;
alter table public.realms enable row level security;
create policy "realms_read_all" on public.realms for select to authenticated using (true);

-- Seed 12 realms
insert into public.realms (name, element, habit_affinity, icon, sort_order) values
  ('Ancient Vaults',    'Arcane',      'Study / Reading',       '🏛', 1),
  ('Chaos Wastes',      'Chaos',       'Strength Training',     '🔥', 2),
  ('The Outer Dark',    'Void',        'Meditation',            '🌀', 3),
  ('Blighted Expanse',  'Death',       'Sleep / Recovery',      '💀', 4),
  ('Wild Frontier',     'Nature',      'Exercise / Fitness',    '🌿', 5),
  ('Divine Threshold',  'Divine',      'Mindfulness',           '✨', 6),
  ('Haunted Veil',      'Dread',       'Night Habits',          '🌙', 7),
  ('Digital Nexus',     'Digital',     'Custom Tasks',          '💻', 8),
  ('Elder Realm',       'Primal',      'Water / Nutrition',     '🐉', 9),
  ('Void Frontier',     'Stellar',     'Ambitious Goals',       '🚀', 10),
  ('Myth Eternal',      'Primordial',  'Any Streak',            '⚡', 11),
  ('Iron Dominion',     'Synthetic',   'Productivity',          '⚙', 12);

-- ─── Monsters ───────────────────────────────────────────────────────────────

create table public.monsters (
  id uuid primary key default gen_random_uuid(),
  bestiary_id int not null default 0,
  release_set int not null default 1,
  realm_id int not null references public.realms(id),
  name text not null,
  rarity public.monster_rarity not null,
  role public.monster_role not null default 'attacker',
  element text not null,
  base_hp int not null default 100,
  base_atk int not null default 30,
  base_def int not null default 20,
  base_spd int not null default 10,
  lore text,
  art_url text,
  origin text,               -- e.g. "D&D", "Warhammer", "Mythology"
  is_ex boolean not null default false,
  realm_skill text,           -- EX-only fourth skill name
  skill_1 text,
  skill_2 text,
  skill_3 text,
  created_at timestamptz not null default now()
);

create index monsters_realm_idx on public.monsters(realm_id);
create index monsters_rarity_idx on public.monsters(rarity);

grant select on public.monsters to authenticated;
grant all on public.monsters to service_role;
alter table public.monsters enable row level security;
create policy "monsters_read_all" on public.monsters for select to authenticated using (true);

-- ─── User Monsters (Collection) ────────────────────────────────────────────

create table public.user_monsters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monster_id uuid not null references public.monsters(id),
  level int not null default 1,
  xp int not null default 0,
  bond_percent numeric not null default 0,   -- 0-100
  awakening_stars int not null default 0,    -- 0-5
  is_on_team boolean not null default false,
  team_slot int,                              -- 1-5 if on team
  obtained_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index user_monsters_user_idx on public.user_monsters(user_id);
create unique index user_monsters_team_slot on public.user_monsters(user_id, team_slot)
  where team_slot is not null;

grant select, insert, update, delete on public.user_monsters to authenticated;
grant all on public.user_monsters to service_role;
alter table public.user_monsters enable row level security;

create policy "user_monsters_select_own" on public.user_monsters for select to authenticated using (auth.uid() = user_id);
create policy "user_monsters_insert_own" on public.user_monsters for insert to authenticated with check (auth.uid() = user_id);
create policy "user_monsters_update_own" on public.user_monsters for update to authenticated using (auth.uid() = user_id);
create policy "user_monsters_delete_own" on public.user_monsters for delete to authenticated using (auth.uid() = user_id);

-- ─── Banners ────────────────────────────────────────────────────────────────

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  banner_type public.banner_type not null,
  realm_id int references public.realms(id),
  featured_monster_id uuid references public.monsters(id),
  art_url text,
  pull_cost_gems int not null default 160,     -- cost per x1 pull in gems
  pull_cost_10_gems int not null default 1600,  -- cost per x10 pull in gems
  pull_cost_seals int,                          -- pact seal cost (if applicable)
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

grant select on public.banners to authenticated;
grant all on public.banners to service_role;
alter table public.banners enable row level security;
create policy "banners_read_all" on public.banners for select to authenticated using (true);

-- ─── Pull History ───────────────────────────────────────────────────────────

create table public.pulls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  banner_id uuid not null references public.banners(id),
  monster_id uuid not null references public.monsters(id),
  rarity public.monster_rarity not null,
  is_new boolean not null default false,           -- first time getting this monster
  is_pity boolean not null default false,           -- was this a pity guarantee
  transcendence_stone boolean not null default false,-- EX duplicate
  currency_spent public.pull_currency not null default 'gems',
  amount_spent int not null default 0,
  created_at timestamptz not null default now()
);

create index pulls_user_idx on public.pulls(user_id, created_at desc);
create index pulls_banner_idx on public.pulls(banner_id, user_id);

grant select, insert on public.pulls to authenticated;
grant all on public.pulls to service_role;
alter table public.pulls enable row level security;

create policy "pulls_select_own" on public.pulls for select to authenticated using (auth.uid() = user_id);
create policy "pulls_insert_own" on public.pulls for insert to authenticated with check (auth.uid() = user_id);

-- ─── Pity Counters ─────────────────────────────────────────────────────────

create table public.pity_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  banner_id uuid not null references public.banners(id),
  rare_pity int not null default 0,       -- resets every 10
  elite_pity int not null default 0,      -- resets every 20
  epic_pity int not null default 0,       -- resets every 50
  legendary_pity int not null default 0,  -- resets every 100
  mythic_pity int not null default 0,     -- resets every 200
  ex_pity int not null default 0,         -- resets every 500
  total_pulls int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, banner_id)
);

grant select, insert, update on public.pity_counters to authenticated;
grant all on public.pity_counters to service_role;
alter table public.pity_counters enable row level security;

create policy "pity_select_own" on public.pity_counters for select to authenticated using (auth.uid() = user_id);
create policy "pity_insert_own" on public.pity_counters for insert to authenticated with check (auth.uid() = user_id);
create policy "pity_update_own" on public.pity_counters for update to authenticated using (auth.uid() = user_id);

create trigger pity_set_updated_at before update on public.pity_counters
for each row execute function public.set_updated_at();

-- ─── Seed: Sample Monsters (Realm 1 — Ancient Vaults) ──────────────────────

insert into public.monsters (realm_id, name, rarity, role, element, base_hp, base_atk, base_def, base_spd, origin, skill_1, skill_2, skill_3, is_ex, realm_skill) values
  -- EX
  (1, 'Vecna the Ascended God', 'ex', 'debuffer', 'Arcane', 500, 180, 120, 90, 'D&D', 'Arcane Annihilation', 'Undeath Aura', 'Secret of the Grave', true, 'Eye of Vecna'),
  -- Mythic
  (1, 'Tiamat', 'mythic', 'attacker', 'Arcane', 450, 200, 100, 70, 'D&D', 'Chromatic Breath', 'Five Heads', 'Dragon Fear', false, null),
  (1, 'Bahamut the Platinum', 'mythic', 'tank', 'Arcane', 500, 150, 180, 60, 'D&D', 'Platinum Breath', 'Divine Shield', 'Celestial Presence', false, null),
  -- Legendary
  (1, 'Ashardalon', 'legendary', 'attacker', 'Arcane', 380, 170, 90, 75, 'D&D', 'Hellfire Blast', 'Heart of Flame', 'Demonic Rage', false, null),
  (1, 'Dracolich Sovereign', 'legendary', 'debuffer', 'Arcane', 350, 160, 100, 65, 'D&D', 'Necro Breath', 'Soul Drain', 'Phylactery Shield', false, null),
  (1, 'Void Dragon', 'legendary', 'debuffer', 'Arcane', 340, 155, 95, 80, 'D&D', 'Void Rift', 'Gravity Well', 'Nullify Magic', false, null),
  -- Epic
  (1, 'Red Dragon Tyrant', 'epic', 'attacker', 'Arcane', 300, 145, 80, 70, 'D&D', 'Fire Breath', 'Wing Buffet', 'Inferno', false, null),
  (1, 'Shadow Dragon', 'epic', 'attacker', 'Arcane', 280, 140, 85, 75, 'D&D', 'Shadow Breath', 'Umbral Cloak', 'Darkness', false, null),
  (1, 'Silver Dragon Elder', 'epic', 'healer', 'Arcane', 320, 120, 110, 60, 'D&D', 'Frost Breath', 'Heal Wounds', 'Paralysis', false, null),
  -- Elite
  (1, 'Linnorm Taiga', 'elite', 'attacker', 'Arcane', 250, 130, 70, 65, 'Pathfinder', 'Tail Sweep', 'Venom Bite', null, false, null),
  (1, 'Deep Dragon', 'elite', 'debuffer', 'Arcane', 240, 125, 75, 70, 'Forgotten Realms', 'Deep Breath', 'Confuse', null, false, null),
  -- Rare
  (1, 'Copper Dragon Jest', 'rare', 'support', 'Arcane', 200, 100, 60, 80, 'D&D', 'Acid Spray', 'Joke', null, false, null),
  (1, 'Wyvern Lord', 'rare', 'attacker', 'Arcane', 210, 110, 55, 85, 'D&D', 'Stinger', 'Dive', null, false, null),
  (1, 'Beholder Tyrant', 'rare', 'debuffer', 'Arcane', 190, 120, 50, 60, 'D&D', 'Eye Ray', 'Anti-Magic', null, false, null),
  -- Uncommon
  (1, 'Owlbear', 'uncommon', 'attacker', 'Arcane', 150, 90, 50, 50, 'D&D', 'Maul', 'Screech', null, false, null),
  (1, 'Displacer Beast', 'uncommon', 'tank', 'Arcane', 160, 80, 65, 55, 'D&D', 'Tentacle', 'Displace', null, false, null),
  -- Common
  (1, 'Goblin Shaman', 'common', 'support', 'Arcane', 80, 50, 30, 60, 'D&D', 'Spark', null, null, false, null),
  (1, 'Kobold Scout', 'common', 'attacker', 'Arcane', 70, 55, 25, 70, 'D&D', 'Sling', null, null, false, null),
  (1, 'Skeleton Warrior', 'common', 'tank', 'Arcane', 90, 45, 40, 40, 'D&D', 'Bone Strike', null, null, false, null),
  (1, 'Giant Rat', 'common', 'attacker', 'Arcane', 60, 40, 20, 75, 'D&D', 'Bite', null, null, false, null);

-- ─── Seed: Default Banner ───────────────────────────────────────────────────

insert into public.banners (name, banner_type, realm_id, pull_cost_gems, pull_cost_10_gems, is_active) values
  ('Standard Summoning', 'standard', null, 160, 1600, true),
  ('Ancient Vaults Focus', 'featured', 1, 200, 2000, true);
-- ═══════════════════════════════════════════════════════════════════════════
-- SummonScroll: Full Game Systems (FR01-FR05)
-- Equipment, Guild/Quests, Shop, Fusion, Battle, Pets, Inventory
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.equipment_slot as enum ('weapon','armor','helm','accessory');
create type public.quest_type as enum ('boss','collection');
create type public.quest_status as enum ('pending','active','completed','failed');
create type public.guild_role as enum ('leader','officer','member');
create type public.shop_category as enum ('equipment','potion','scroll','seasonal','armoire');
create type public.battle_mode as enum ('chaos_tower','event','boss_rush');

-- ─── Add mana + stats to profiles ──────────────────────────────────────────

alter table public.profiles
  add column if not exists mp int not null default 30,
  add column if not exists max_mp int not null default 30,
  add column if not exists str_stat int not null default 0,
  add column if not exists int_stat int not null default 0,
  add column if not exists per_stat int not null default 0,
  add column if not exists equipped_weapon uuid,
  add column if not exists equipped_armor uuid,
  add column if not exists equipped_helm uuid,
  add column if not exists equipped_accessory uuid;

-- ─── Equipment ──────────────────────────────────────────────────────────────

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slot public.equipment_slot not null,
  class_affinity public.player_class, -- null = any class, set = 50% bonus for that class
  str_bonus int not null default 0,
  int_bonus int not null default 0,
  con_bonus int not null default 0,
  per_bonus int not null default 0,
  rarity text not null default 'common',
  price int not null default 100,
  description text,
  is_armoire_exclusive boolean not null default false,
  is_seasonal boolean not null default false,
  season text, -- 'spring','summer','fall','winter'
  art_url text,
  created_at timestamptz not null default now()
);

grant select on public.equipment to authenticated;
grant all on public.equipment to service_role;
alter table public.equipment enable row level security;
create policy "equipment_read_all" on public.equipment for select to authenticated using (true);

-- ─── User Equipment (Inventory) ─────────────────────────────────────────────

create table public.user_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  is_equipped boolean not null default false,
  obtained_at timestamptz not null default now()
);

create index user_equipment_user_idx on public.user_equipment(user_id);

grant select, insert, update, delete on public.user_equipment to authenticated;
grant all on public.user_equipment to service_role;
alter table public.user_equipment enable row level security;
create policy "user_equipment_own" on public.user_equipment for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Shop Items ─────────────────────────────────────────────────────────────

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category public.shop_category not null,
  price int not null,
  currency text not null default 'gems', -- 'gems' or 'pact_seals'
  stock int, -- null = unlimited
  daily_reset boolean not null default false,
  equipment_id uuid references public.equipment(id),
  effect_type text, -- 'heal_hp','xp_boost','bond_boost','hatch_potion'
  effect_value int,
  effect_meta text, -- JSON for extra data like realm name for potions
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.shop_items to authenticated;
grant all on public.shop_items to service_role;
alter table public.shop_items enable row level security;
create policy "shop_items_read" on public.shop_items for select to authenticated using (true);

-- ─── Purchase History ───────────────────────────────────────────────────────

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_item_id uuid not null references public.shop_items(id),
  quantity int not null default 1,
  total_cost int not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.purchases to authenticated;
grant all on public.purchases to service_role;
alter table public.purchases enable row level security;
create policy "purchases_own" on public.purchases for select to authenticated using (auth.uid() = user_id);
create policy "purchases_insert_own" on public.purchases for insert to authenticated with check (auth.uid() = user_id);

-- ─── User Inventory (consumables, eggs, potions, food) ──────────────────────

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null, -- 'egg','realm_potion','food','fusion_shard','quest_scroll','health_potion','xp_booster','bond_booster'
  item_name text not null,
  item_meta text, -- JSON: realm, rarity, etc.
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  unique(user_id, item_type, item_name)
);

grant select, insert, update, delete on public.inventory to authenticated;
grant all on public.inventory to service_role;
alter table public.inventory enable row level security;
create policy "inventory_own" on public.inventory for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Guilds ─────────────────────────────────────────────────────────────────

create table public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  leader_id uuid not null references auth.users(id),
  level int not null default 1,
  privacy text not null default 'open', -- 'open','apply','invite'
  max_members int not null default 30,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.guilds to authenticated;
grant all on public.guilds to service_role;
alter table public.guilds enable row level security;
create policy "guilds_read_all" on public.guilds for select to authenticated using (true);
create policy "guilds_insert" on public.guilds for insert to authenticated with check (auth.uid() = leader_id);
create policy "guilds_update_leader" on public.guilds for update to authenticated using (auth.uid() = leader_id);

-- ─── Guild Members ──────────────────────────────────────────────────────────

create table public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.guild_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique(guild_id, user_id)
);

grant select, insert, update, delete on public.guild_members to authenticated;
grant all on public.guild_members to service_role;
alter table public.guild_members enable row level security;
create policy "guild_members_read" on public.guild_members for select to authenticated using (true);
create policy "guild_members_insert" on public.guild_members for insert to authenticated with check (auth.uid() = user_id);
create policy "guild_members_delete_own" on public.guild_members for delete to authenticated using (auth.uid() = user_id);

-- ─── Quest Scrolls (Templates) ─────────────────────────────────────────────

create table public.quest_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quest_type public.quest_type not null,
  boss_name text,
  boss_hp int,
  boss_str int default 10,
  boss_rage_max int,
  collection_items jsonb, -- [{name, required_count}]
  reward_gems int not null default 100,
  reward_xp int not null default 50,
  reward_drops jsonb, -- [{item_type, item_name, chance}]
  difficulty text not null default 'easy',
  description text,
  art_url text,
  created_at timestamptz not null default now()
);

grant select on public.quest_templates to authenticated;
grant all on public.quest_templates to service_role;
alter table public.quest_templates enable row level security;
create policy "quest_templates_read" on public.quest_templates for select to authenticated using (true);

-- ─── Active Guild Quests ────────────────────────────────────────────────────

create table public.guild_quests (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  quest_template_id uuid not null references public.quest_templates(id),
  started_by uuid not null references auth.users(id),
  status public.quest_status not null default 'active',
  boss_hp_remaining int,
  boss_rage int not null default 0,
  collection_progress jsonb, -- {item_name: current_count}
  total_damage_dealt int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

grant select, insert, update on public.guild_quests to authenticated;
grant all on public.guild_quests to service_role;
alter table public.guild_quests enable row level security;
create policy "guild_quests_read" on public.guild_quests for select to authenticated using (true);
create policy "guild_quests_insert" on public.guild_quests for insert to authenticated with check (auth.uid() = started_by);
create policy "guild_quests_update" on public.guild_quests for update to authenticated using (true);

-- ─── Quest Participation (damage tracking per member) ───────────────────────

create table public.quest_participants (
  id uuid primary key default gen_random_uuid(),
  guild_quest_id uuid not null references public.guild_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  damage_dealt int not null default 0,
  items_found int not null default 0,
  damage_taken int not null default 0,
  joined_at timestamptz not null default now(),
  unique(guild_quest_id, user_id)
);

grant select, insert, update on public.quest_participants to authenticated;
grant all on public.quest_participants to service_role;
alter table public.quest_participants enable row level security;
create policy "quest_participants_read" on public.quest_participants for select to authenticated using (true);
create policy "quest_participants_insert" on public.quest_participants for insert to authenticated with check (auth.uid() = user_id);
create policy "quest_participants_update" on public.quest_participants for update to authenticated using (auth.uid() = user_id);

-- ─── Arena Battles ──────────────────────────────────────────────────────────

create table public.arena_battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode public.battle_mode not null,
  floor int not null default 1,
  team_ids uuid[] not null, -- user_monster ids
  team_power int not null default 0,
  enemy_name text not null,
  enemy_hp int not null,
  player_won boolean,
  rounds int not null default 0,
  battle_log jsonb, -- array of {round, actor, action, damage}
  reward_gems int not null default 0,
  reward_xp int not null default 0,
  reward_shards int not null default 0,
  created_at timestamptz not null default now()
);

create index arena_battles_user_idx on public.arena_battles(user_id, created_at desc);

grant select, insert on public.arena_battles to authenticated;
grant all on public.arena_battles to service_role;
alter table public.arena_battles enable row level security;
create policy "arena_battles_own" on public.arena_battles for select to authenticated using (auth.uid() = user_id);
create policy "arena_battles_insert_own" on public.arena_battles for insert to authenticated with check (auth.uid() = user_id);

-- ─── Chaos Tower Progress ───────────────────────────────────────────────────

create table public.tower_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  highest_floor int not null default 0,
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.tower_progress to authenticated;
grant all on public.tower_progress to service_role;
alter table public.tower_progress enable row level security;
create policy "tower_own" on public.tower_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Fusion Recipes ─────────────────────────────────────────────────────────

create table public.fusion_recipes (
  id uuid primary key default gen_random_uuid(),
  ingredient_1_id uuid not null references public.monsters(id),
  ingredient_2_id uuid not null references public.monsters(id),
  ingredient_3_id uuid references public.monsters(id), -- null = 2-ingredient
  result_id uuid not null references public.monsters(id),
  is_cross_realm boolean not null default false,
  success_rate numeric not null default 1.0,
  created_at timestamptz not null default now()
);

grant select on public.fusion_recipes to authenticated;
grant all on public.fusion_recipes to service_role;
alter table public.fusion_recipes enable row level security;
create policy "fusion_recipes_read" on public.fusion_recipes for select to authenticated using (true);

-- ─── Pets & Mounts ──────────────────────────────────────────────────────────

create table public.user_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_name text not null,
  egg_type text not null,
  potion_type text not null, -- realm name
  food_fed int not null default 0,
  is_mount boolean not null default false, -- fed enough -> mount
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, egg_type, potion_type)
);

grant select, insert, update on public.user_pets to authenticated;
grant all on public.user_pets to service_role;
alter table public.user_pets enable row level security;
create policy "user_pets_own" on public.user_pets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Achievements ───────────────────────────────────────────────────────────

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null default '🏆',
  condition_type text not null, -- 'habits_completed','monsters_collected','battles_won','streak_days','level_reached'
  condition_value int not null,
  reward_gems int not null default 0,
  reward_title text, -- unlockable title
  created_at timestamptz not null default now()
);

grant select on public.achievements to authenticated;
grant all on public.achievements to service_role;
alter table public.achievements enable row level security;
create policy "achievements_read" on public.achievements for select to authenticated using (true);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id),
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

grant select, insert on public.user_achievements to authenticated;
grant all on public.user_achievements to service_role;
alter table public.user_achievements enable row level security;
create policy "user_achievements_own" on public.user_achievements for select to authenticated using (auth.uid() = user_id);
create policy "user_achievements_insert" on public.user_achievements for insert to authenticated with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Equipment ──────────────────────────────────────────────────────────────

insert into public.equipment (name, slot, class_affinity, str_bonus, int_bonus, con_bonus, per_bonus, rarity, price, description) values
  -- Weapons
  ('Iron Sword',        'weapon', 'warrior', 8, 0, 2, 0, 'common', 50, 'A sturdy blade for beginners.'),
  ('Arcane Staff',      'weapon', 'mage',    0, 12, 0, 3, 'common', 50, 'Channels arcane energy.'),
  ('Shadow Dagger',     'weapon', 'rogue',   5, 0, 0, 8, 'common', 50, 'Quick and silent.'),
  ('Healing Scepter',   'weapon', 'healer',  0, 5, 8, 0, 'common', 50, 'Restores vitality.'),
  ('Dragon Fang Blade', 'weapon', 'warrior', 18, 0, 5, 0, 'rare', 300, 'Forged from a dragon''s tooth.'),
  ('Void Grimoire',     'weapon', 'mage',    0, 22, 0, 8, 'rare', 300, 'Pages of forbidden spells.'),
  ('Phantom Stiletto',  'weapon', 'rogue',   12, 0, 0, 18, 'rare', 300, 'Strikes from the shadows.'),
  ('Beacon of Light',   'weapon', 'healer',  0, 10, 16, 0, 'rare', 300, 'Blessed by divine light.'),
  -- Armor
  ('Leather Vest',      'armor', null, 0, 0, 8, 2, 'common', 40, 'Basic protection.'),
  ('Dragon Scale Mail', 'armor', 'warrior', 5, 0, 18, 0, 'rare', 350, 'Scales harder than steel.'),
  ('Void Robes',        'armor', 'mage', 0, 8, 12, 5, 'rare', 350, 'Woven from void threads.'),
  ('Shadow Cloak',      'armor', 'rogue', 0, 0, 10, 15, 'rare', 350, 'Blends with darkness.'),
  -- Helms
  ('Iron Helm',         'helm', null, 2, 0, 5, 0, 'common', 30, 'Solid head protection.'),
  ('Crown of Flames',   'helm', 'warrior', 8, 0, 8, 0, 'rare', 250, 'Burns with inner fire.'),
  ('Hood of Shadows',   'helm', 'rogue', 0, 0, 3, 12, 'rare', 250, 'See without being seen.'),
  -- Accessories
  ('Ring of Fortitude', 'accessory', null, 0, 0, 6, 0, 'common', 25, 'Boosts endurance.'),
  ('Amulet of Perception','accessory', null, 0, 0, 0, 8, 'common', 25, 'Sharpens the senses.'),
  ('Signet of the Archmage','accessory','mage', 0, 15, 0, 5, 'rare', 280, 'Mark of mastery.');

-- ─── Armoire Exclusives ─────────────────────────────────────────────────────

insert into public.equipment (name, slot, class_affinity, str_bonus, int_bonus, con_bonus, per_bonus, rarity, price, description, is_armoire_exclusive) values
  ('Enchanted Gauntlets', 'accessory', 'warrior', 10, 0, 10, 0, 'elite', 0, 'Found in the Enchanted Armoire.', true),
  ('Crystal Monocle',     'helm', 'mage', 0, 14, 0, 8, 'elite', 0, 'Found in the Enchanted Armoire.', true),
  ('Lucky Charm',         'accessory', 'rogue', 0, 0, 5, 15, 'elite', 0, 'Found in the Enchanted Armoire.', true);

-- ─── Shop Items ─────────────────────────────────────────────────────────────

insert into public.shop_items (name, description, category, price, currency, effect_type, effect_value, sort_order) values
  ('Health Potion',   'Restores 15 HP.',                      'potion', 25,  'gems', 'heal_hp', 15, 1),
  ('Fortify Potion',  'Prevent HP loss from missed Dailies for 1 day.', 'potion', 100, 'gems', 'fortify', 1, 2),
  ('Bond Accelerator','2× bond XP gain for 24 hours.',        'potion', 200, 'gems', 'bond_boost', 2, 3),
  ('XP Booster',      '2× XP gain for 24 hours.',             'potion', 150, 'gems', 'xp_boost', 2, 4),
  ('Enchanted Armoire','A chance at rare equipment, food, or XP!','armoire',100,'gems','armoire',0, 10);

-- ─── Quest Templates ────────────────────────────────────────────────────────

insert into public.quest_templates (name, quest_type, boss_name, boss_hp, boss_str, boss_rage_max, difficulty, reward_gems, reward_xp, description) values
  ('Shadow Drake Hunt',   'boss', 'Shadow Drake',  5000, 8,  500, 'easy',   200, 100, 'A drake terrorizes the Ancient Vaults.'),
  ('Tiamat''s Wrath',     'boss', 'Tiamat',       15000, 15, 1000, 'hard',   500, 300, 'The chromatic dragon awakens.'),
  ('Lich King''s Return', 'boss', 'Lich Sovereign',10000, 12, 800, 'medium', 350, 200, 'The undead lord rises again.');

insert into public.quest_templates (name, quest_type, collection_items, difficulty, reward_gems, reward_xp, description) values
  ('Dragon Scale Gathering', 'collection', '[{"name":"Dragon Scale","required_count":30}]', 'easy', 150, 80, 'Collect scales from the Vaults.'),
  ('Void Essence Hunt',      'collection', '[{"name":"Void Essence","required_count":20},{"name":"Shadow Fragment","required_count":15}]', 'medium', 300, 150, 'Gather materials from the Outer Dark.');

-- ─── Achievements ───────────────────────────────────────────────────────────

insert into public.achievements (name, description, icon, condition_type, condition_value, reward_gems) values
  ('First Steps',        'Complete your first task.',         '👣', 'habits_completed', 1, 10),
  ('Habit Former',       'Complete 50 tasks.',                '📋', 'habits_completed', 50, 50),
  ('Century Grinder',    'Complete 100 tasks.',               '💯', 'habits_completed', 100, 100),
  ('First Summon',       'Collect your first monster.',       '🥚', 'monsters_collected', 1, 20),
  ('Collector',          'Collect 25 monsters.',              '📖', 'monsters_collected', 25, 100),
  ('Bestiary Master',    'Collect 100 monsters.',             '🏆', 'monsters_collected', 100, 500),
  ('Battle Ready',       'Win your first arena battle.',      '⚔', 'battles_won', 1, 20),
  ('Veteran Fighter',    'Win 50 arena battles.',             '🗡', 'battles_won', 50, 200),
  ('Week Warrior',       'Maintain a 7-day streak.',          '🔥', 'streak_days', 7, 50),
  ('Month Master',       'Maintain a 30-day streak.',         '🌟', 'streak_days', 30, 200),
  ('Level 10',           'Reach level 10.',                   '⭐', 'level_reached', 10, 50),
  ('Level 25',           'Reach level 25.',                   '🌙', 'level_reached', 25, 150),
  ('Level 50',           'Reach level 50.',                   '👑', 'level_reached', 50, 500);

-- ─── Add more monsters (Realms 2-4 samples) ────────────────────────────────

insert into public.monsters (realm_id, name, rarity, role, element, base_hp, base_atk, base_def, base_spd, origin, skill_1, skill_2, skill_3, is_ex, realm_skill) values
  -- Realm 2: Chaos Wastes
  (2, 'The Everchosen Archaon', 'ex', 'attacker', 'Chaos', 520, 200, 130, 85, 'Warhammer', 'Chaos Strike', 'Daemon Sword', 'End Times', true, 'Mark of the Everchosen'),
  (2, 'Swarmlord', 'mythic', 'attacker', 'Chaos', 480, 190, 110, 90, 'WH40K', 'Bone Sabres', 'Synapse', 'Hive Mind', false, null),
  (2, 'Bloodthirster', 'legendary', 'attacker', 'Chaos', 400, 185, 95, 80, 'Warhammer', 'Axe of Khorne', 'Daemonic Flight', 'Blood Frenzy', false, null),
  (2, 'Chaos Spawn', 'epic', 'tank', 'Chaos', 350, 130, 120, 50, 'Warhammer', 'Mutate', 'Regenerate', 'Flail', false, null),
  (2, 'Plague Bearer', 'elite', 'debuffer', 'Chaos', 280, 100, 90, 40, 'Warhammer', 'Plague Touch', 'Nurgle Rot', null, false, null),
  (2, 'Marauder', 'rare', 'attacker', 'Chaos', 200, 110, 60, 70, 'Warhammer', 'Rage', 'Pillage', null, false, null),
  (2, 'Beastman', 'uncommon', 'attacker', 'Chaos', 160, 85, 50, 60, 'Warhammer', 'Gore', 'Bray', null, false, null),
  (2, 'Chaos Cultist', 'common', 'support', 'Chaos', 80, 40, 25, 55, 'Warhammer', 'Dark Prayer', null, null, false, null),
  -- Realm 3: The Outer Dark
  (3, 'Azathoth the Blind Idiot', 'ex', 'debuffer', 'Void', 550, 170, 140, 70, 'Lovecraft', 'Mindless Void', 'Cosmic Madness', 'Nuclear Chaos', true, 'Daemon Sultan'),
  (3, 'Cthulhu the Dreamer', 'mythic', 'debuffer', 'Void', 500, 180, 120, 60, 'Lovecraft', 'Madness Aura', 'Tentacle Crush', 'Dream Walk', false, null),
  (3, 'Nyarlathotep', 'legendary', 'support', 'Void', 380, 160, 100, 85, 'Lovecraft', 'Thousand Forms', 'Deceive', 'Crawling Chaos', false, null),
  (3, 'Deep One', 'elite', 'tank', 'Void', 260, 100, 100, 45, 'Lovecraft', 'Trident', 'Deep Call', null, false, null),
  (3, 'Shoggoth', 'rare', 'tank', 'Void', 230, 90, 110, 30, 'Lovecraft', 'Absorb', 'Morph', null, false, null),
  (3, 'Mi-Go', 'uncommon', 'support', 'Void', 140, 70, 55, 65, 'Lovecraft', 'Brain Cylinder', 'Fly', null, false, null),
  (3, 'Cultist', 'common', 'debuffer', 'Void', 70, 45, 20, 50, 'Lovecraft', 'Chant', null, null, false, null),
  -- Realm 4: Blighted Expanse
  (4, 'The Nameless King', 'ex', 'attacker', 'Death', 530, 210, 125, 80, 'Dark Souls', 'Lightning Spear', 'Storm Drake', 'King of Storm', true, 'Lord of Cinder'),
  (4, 'Malenia Blade of Miquella', 'mythic', 'attacker', 'Death', 460, 205, 100, 95, 'Elden Ring', 'Waterfowl Dance', 'Scarlet Rot', 'Goddess of Rot', false, null),
  (4, 'Slave Knight Gael', 'legendary', 'attacker', 'Death', 400, 180, 110, 75, 'Dark Souls', 'Greatsword Combo', 'Dark Soul', 'Lightning', false, null),
  (4, 'Pursuer', 'epic', 'tank', 'Death', 320, 140, 130, 55, 'Dark Souls', 'Charge', 'Dark Magic', 'Curse', false, null),
  (4, 'Hollow Knight', 'elite', 'attacker', 'Death', 240, 120, 80, 70, 'Dark Souls', 'Slash', 'Parry', null, false, null),
  (4, 'Undead Soldier', 'rare', 'tank', 'Death', 210, 95, 90, 50, 'Dark Souls', 'Shield Bash', 'Endure', null, false, null),
  (4, 'Hollow', 'uncommon', 'attacker', 'Death', 130, 75, 45, 55, 'Dark Souls', 'Lunge', 'Wail', null, false, null),
  (4, 'Rat King', 'common', 'debuffer', 'Death', 65, 35, 20, 70, 'Dark Souls', 'Swarm', null, null, false, null);

-- Add more banners
insert into public.banners (name, banner_type, realm_id, pull_cost_gems, pull_cost_10_gems, is_active) values
  ('Chaos Wastes Focus',    'featured', 2, 200, 2000, true),
  ('Outer Dark Focus',      'featured', 3, 200, 2000, true),
  ('Blighted Expanse Focus','featured', 4, 200, 2000, true),
  ('Pact Seal Banner',      'pact_seal', null, 0, 0, true);

-- Set pact seal cost
update public.banners set pull_cost_seals = 1 where banner_type = 'pact_seal';

-- Add quest scroll shop items
insert into public.shop_items (name, description, category, price, currency, effect_type, effect_meta, sort_order) values
  ('Shadow Drake Scroll', 'Start the Shadow Drake Hunt quest.', 'scroll', 200, 'gems', 'quest_scroll', '{"quest":"Shadow Drake Hunt"}', 20),
  ('Tiamat Scroll',       'Start the Tiamat''s Wrath quest.',   'scroll', 500, 'gems', 'quest_scroll', '{"quest":"Tiamat''s Wrath"}', 21),
  ('Dragon Scale Scroll', 'Start the Dragon Scale Gathering quest.','scroll', 150, 'gems', 'quest_scroll', '{"quest":"Dragon Scale Gathering"}', 22);
-- Remove pity mechanic entirely. Every pull is now an independent roll.

-- Drop pity_counters table (RLS policies and trigger drop with it).
drop trigger if exists pity_set_updated_at on public.pity_counters;
drop policy if exists "pity_select_own" on public.pity_counters;
drop policy if exists "pity_insert_own" on public.pity_counters;
drop policy if exists "pity_update_own" on public.pity_counters;
drop table if exists public.pity_counters;

-- Drop is_pity column from pulls history.
alter table public.pulls drop column if exists is_pity;
-- 1. Streak freeze charges on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_charges int NOT NULL DEFAULT 0;

-- 2. Class change cooldown
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_class_change timestamptz;

-- 3. Freeze Charm shop item (costs 1 Pact Seal)
INSERT INTO shop_items (name, description, category, price, currency, effect_type, effect_value, sort_order)
VALUES ('Freeze Charm', 'Preserves your streak when you miss a daily. Auto-consumed at cron.', 'potion', 1, 'pact_seals', 'streak_freeze', 1, 5)
ON CONFLICT DO NOTHING;
-- Phase 3 Features Migration

-- Ascension
ALTER TABLE public.user_monsters ADD COLUMN ascension_level INT NOT NULL DEFAULT 0;

-- Talents, Combos
ALTER TABLE public.profiles ADD COLUMN talents JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN combo_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN last_task_time TIMESTAMP WITH TIME ZONE;

-- Tags
ALTER TABLE public.tasks ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}'::text[];
