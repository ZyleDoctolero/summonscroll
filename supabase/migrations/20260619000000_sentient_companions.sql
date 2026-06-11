-- ────────────────────────────────────────────────────────────────────────────
-- Step 11: Sentient Companions.
--   • user_monsters.last_active_at: timestamp of last bond-touching event
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.user_monsters
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now();

COMMIT;
