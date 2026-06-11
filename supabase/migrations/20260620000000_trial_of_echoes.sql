-- ────────────────────────────────────────────────────────────────────────────
-- Step 12: Trial of Echoes (permadeath).
--   • trial_runs table: snapshot fallen monsters for the Memorial
--   • profiles.last_trial_at for 7-day cooldown
--   • profiles.echo_touched: cosmetic flag for first full clear
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_trial_at timestamptz,
  ADD COLUMN IF NOT EXISTS echo_touched boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.trial_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_user_monster_ids uuid[] NOT NULL,
  floors_cleared int NOT NULL DEFAULT 0,
  fallen jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{name, role, rarity, star_level, bond, awakened_skills}]
  full_clear boolean NOT NULL DEFAULT false,
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_runs_user_idx
  ON public.trial_runs(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.trial_runs TO authenticated;
GRANT ALL ON public.trial_runs TO service_role;
ALTER TABLE public.trial_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trial_runs_select_own" ON public.trial_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "trial_runs_insert_own" ON public.trial_runs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

COMMIT;
