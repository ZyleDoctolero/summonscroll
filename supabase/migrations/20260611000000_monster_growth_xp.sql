-- ────────────────────────────────────────────────────────────────────────────
-- Step 2: Monster bond ticks from habits.
--   • user_monsters.growth_xp: cumulative "deeds done with this monster"
--   • Helper SQL function role_to_stat(role) for app-side joins.
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.user_monsters
  ADD COLUMN IF NOT EXISTS growth_xp int NOT NULL DEFAULT 0;

-- Helper: monster role → growth stat.
-- Pure function; safe to inline in any join/where.
CREATE OR REPLACE FUNCTION public.role_to_stat(r text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE r
    WHEN 'attacker' THEN 'str'
    WHEN 'tank'     THEN 'con'
    WHEN 'healer'   THEN 'con'
    WHEN 'support'  THEN 'int'
    WHEN 'debuffer' THEN 'per'
    ELSE 'str'
  END
$$;

COMMIT;
