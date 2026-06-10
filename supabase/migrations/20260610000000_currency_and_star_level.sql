-- ────────────────────────────────────────────────────────────────────────────
-- Step 1 of Pick Me Up + Pillars integration:
--   • Rename gems → crystals (the gacha currency rebrand)
--     - profile.gems → profile.crystals
--     - banner cost columns
--     - reward_gems on arena_battles / achievements / task_events (conditional)
--     - shop_items.currency value 'gems' → 'crystals'
--   • profile.gold stays (small-earn / shop currency)
--   • profile.pact_seals stays (exclusive seal banner currency)
--   • user_monsters.awakening_stars (0..5) → star_level (1..7) with CHECK
--   • Leave the pull_currency enum and banner_type enum intact for now
--     (legacy enum values remain valid; UI uses new labels)
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── Profile: gems → crystals ─────────────────────────────────────────────
ALTER TABLE public.profiles RENAME COLUMN gems TO crystals;

-- ─── Banner cost columns: gems → crystals ─────────────────────────────────
ALTER TABLE public.banners RENAME COLUMN pull_cost_gems    TO pull_cost_crystals;
ALTER TABLE public.banners RENAME COLUMN pull_cost_10_gems TO pull_cost_10_crystals;
-- pull_cost_seals unchanged (still the seal banner cost)

-- ─── Reward columns: reward_gems → reward_crystals (conditional) ──────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='arena_battles' AND column_name='reward_gems'
  ) THEN
    ALTER TABLE public.arena_battles RENAME COLUMN reward_gems TO reward_crystals;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='achievements' AND column_name='reward_gems'
  ) THEN
    ALTER TABLE public.achievements RENAME COLUMN reward_gems TO reward_crystals;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='task_events' AND column_name='reward_gems'
  ) THEN
    ALTER TABLE public.task_events RENAME COLUMN reward_gems TO reward_crystals;
  END IF;
END $$;

-- ─── Shop items: 'gems' currency value → 'crystals' ───────────────────────
UPDATE public.shop_items SET currency = 'crystals' WHERE currency = 'gems';
ALTER TABLE public.shop_items ALTER COLUMN currency SET DEFAULT 'gold';

-- ─── Star Level unification ───────────────────────────────────────────────
-- awakening_stars was bounded 0..5; new star_level is bounded 1..7.
ALTER TABLE public.user_monsters RENAME COLUMN awakening_stars TO star_level;
UPDATE public.user_monsters SET star_level = GREATEST(star_level, 1);
ALTER TABLE public.user_monsters ALTER COLUMN star_level SET DEFAULT 1;
ALTER TABLE public.user_monsters
  ADD CONSTRAINT user_monsters_star_level_range CHECK (star_level BETWEEN 1 AND 7);

COMMIT;
