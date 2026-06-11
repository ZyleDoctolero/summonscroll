-- ────────────────────────────────────────────────────────────────────────────
-- Step 9: Tower restructure - milestone floors + Wailing Wall + Apex.
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.tower_progress
  ADD COLUMN IF NOT EXISTS wailing_wall_cleared_at timestamptz,
  ADD COLUMN IF NOT EXISTS apex_cleared_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_defeat_at timestamptz;

COMMIT;
