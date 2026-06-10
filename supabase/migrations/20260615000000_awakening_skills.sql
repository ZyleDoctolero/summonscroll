-- ────────────────────────────────────────────────────────────────────────────
-- Step 6: Skill Awakening by Deeds.
--   • user_monsters.awakened_skills: names of awakening skills unlocked for this instance
--   • monsters.awakening_skill_count: defaulted to 1 (informational; defs live in code)
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.user_monsters
  ADD COLUMN IF NOT EXISTS awakened_skills text[] NOT NULL DEFAULT '{}'::text[];

-- Audit log for awakening events (Codex "Awakening Log" lives off this)
CREATE TABLE IF NOT EXISTS public.awakening_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_monster_id uuid NOT NULL REFERENCES public.user_monsters(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  trigger_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS awakening_events_user_idx
  ON public.awakening_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.awakening_events TO authenticated;
GRANT ALL ON public.awakening_events TO service_role;
ALTER TABLE public.awakening_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awakening_events_select_own" ON public.awakening_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "awakening_events_insert_own" ON public.awakening_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

COMMIT;
