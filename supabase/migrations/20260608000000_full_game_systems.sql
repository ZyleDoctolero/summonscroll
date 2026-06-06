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
