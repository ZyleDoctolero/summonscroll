-- ────────────────────────────────────────────────────────────────────────────
-- Phase 2: Beast Tamer Mechanics Overhaul
-- Incorporating:
-- 1. Idle Expeditions (Astral Pet Store style dispatch)
-- 2. Branching Alchemy Recipes (Monster Pet Evolution)
-- 3. Companion Equipment & Soul Load (Let Me Game In Peace)
-- 4. Duplicate Fusion & Star Ascension (Monster Paradise)
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. Idle Expeditions ──────────────────────────────────────────────────
-- Unlike the instant 'expeditions' table, this tracks long-running dispatches.
CREATE TABLE IF NOT EXISTS public.idle_expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_monster_id uuid NOT NULL REFERENCES public.user_monsters(id) ON DELETE CASCADE,
  realm_name text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  duration_minutes int NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  rewards jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idle_expeditions_user_idx
  ON public.idle_expeditions(user_id, completed);

GRANT SELECT, INSERT, UPDATE ON public.idle_expeditions TO authenticated;
GRANT ALL ON public.idle_expeditions TO service_role;
ALTER TABLE public.idle_expeditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idle_expeditions_select_own" ON public.idle_expeditions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "idle_expeditions_insert_own" ON public.idle_expeditions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "idle_expeditions_update_own" ON public.idle_expeditions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ─── 2. Branching Alchemy Recipes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evolution_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_monster_id text NOT NULL, -- references monsters.name or ID
  catalyst_item_id text NOT NULL,
  result_monster_id text NOT NULL
);

GRANT SELECT ON public.evolution_recipes TO authenticated;
GRANT ALL ON public.evolution_recipes TO service_role;
ALTER TABLE public.evolution_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evolution_recipes_read_all" ON public.evolution_recipes FOR SELECT USING (true);

-- ─── 3. Companion Equipment & Soul Load ───────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS soul_load_max int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS soul_load_current int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equip_weapon_id uuid REFERENCES public.user_monsters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equip_armor_id uuid REFERENCES public.user_monsters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equip_mount_id uuid REFERENCES public.user_monsters(id) ON DELETE SET NULL;

-- ─── 4. Duplicate Fusion & Star Ascension ─────────────────────────────────
ALTER TABLE public.user_monsters
  ADD COLUMN IF NOT EXISTS star_rating int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_equipped boolean NOT NULL DEFAULT false;

COMMIT;
