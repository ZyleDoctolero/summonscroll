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
