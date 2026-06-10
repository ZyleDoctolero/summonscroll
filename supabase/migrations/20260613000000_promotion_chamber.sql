-- ────────────────────────────────────────────────────────────────────────────
-- Step 4: Promotion Chamber.
--   • promotion_attempts log table
--   • CHECK already exists on user_monsters.star_level (1..7) from Step 1.
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE TABLE IF NOT EXISTS public.promotion_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_monster_id uuid NOT NULL REFERENCES public.user_monsters(id) ON DELETE CASCADE,
  from_star int NOT NULL,
  to_star int NOT NULL,
  stones_spent jsonb NOT NULL DEFAULT '[]'::jsonb,
  materials_spent jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promotion_attempts_user_idx
  ON public.promotion_attempts(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.promotion_attempts TO authenticated;
GRANT ALL ON public.promotion_attempts TO service_role;
ALTER TABLE public.promotion_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotion_attempts_select_own" ON public.promotion_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "promotion_attempts_insert_own" ON public.promotion_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

COMMIT;
