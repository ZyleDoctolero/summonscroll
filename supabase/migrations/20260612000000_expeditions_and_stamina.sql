-- ────────────────────────────────────────────────────────────────────────────
-- Step 3: Weekday Expeditions + Stamina (Pick Me Up's Daily Dungeons)
--
--   • Stamina: max 60, regen 1 per 10min, computed client-side from last_tick.
--   • Expeditions log: every run, what dropped, who ran it.
--
--   Weekday rotation (local-day, day_of_week 0=Sun..6=Sat):
--     0=Crossroads (all), 1/2=Iron Pits (STR), 3/4=Sage Wood (INT), 5/6=Stone Heights (CON)
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── Stamina on profile ────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stamina int NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS stamina_max int NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS stamina_last_tick timestamptz NOT NULL DEFAULT now();

-- ─── Expeditions log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expedition_type text NOT NULL,           -- 'iron_pits' | 'sage_wood' | 'stone_heights' | 'crossroads'
  day_of_week int NOT NULL,                -- 0..6 at run time
  team_size int NOT NULL,
  team_power int NOT NULL,
  enemies_defeated int NOT NULL,
  elite_encounter boolean NOT NULL DEFAULT false,
  drops jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{type, name, qty}]
  stamina_spent int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expeditions_user_idx
  ON public.expeditions(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.expeditions TO authenticated;
GRANT ALL ON public.expeditions TO service_role;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expeditions_select_own" ON public.expeditions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "expeditions_insert_own" ON public.expeditions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

COMMIT;
