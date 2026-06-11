-- ────────────────────────────────────────────────────────────────────────────
-- Step 10: Blacksmith Forge.
--   • recipes table: ingredient names + qtys, equipment_id FK, unlock_condition
--   • crafts log
--   • user_equipment.quality + user_equipment.affix (for masterwork rolls)
--   • Seed five starter recipes
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.user_equipment
  ADD COLUMN IF NOT EXISTS quality text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS affix jsonb;

CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id),
  ingredients jsonb NOT NULL,            -- [{name, qty}]
  unlock_condition jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {level, floor, ...}
  base_gold_cost int NOT NULL DEFAULT 200,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id),
  quality text NOT NULL DEFAULT 'standard',
  affix jsonb,
  user_equipment_id uuid REFERENCES public.user_equipment(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crafts_user_idx ON public.crafts(user_id, created_at DESC);

GRANT SELECT ON public.recipes TO authenticated, anon;
GRANT ALL ON public.recipes TO service_role;
GRANT SELECT, INSERT ON public.crafts TO authenticated;
GRANT ALL ON public.crafts TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_read_all" ON public.recipes FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "crafts_select_own" ON public.crafts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "crafts_insert_own" ON public.crafts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── Seed 5 starter recipes (use existing equipment rows) ──────────────────
-- We pick the cheapest equipment for each slot as the craftable seed.
INSERT INTO public.recipes (name, equipment_id, ingredients, unlock_condition, base_gold_cost, sort_order)
SELECT
  'Forged ' || e.name,
  e.id,
  '[{"name":"Strength Stone","qty":3},{"name":"Iron Shard","qty":1}]'::jsonb,
  '{"level":1}'::jsonb,
  150,
  10
FROM public.equipment e
WHERE e.slot = 'weapon'
ORDER BY e.price ASC
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.recipes (name, equipment_id, ingredients, unlock_condition, base_gold_cost, sort_order)
SELECT
  'Forged ' || e.name,
  e.id,
  '[{"name":"Hearth Stone","qty":3},{"name":"Granite Core","qty":1}]'::jsonb,
  '{"level":5}'::jsonb,
  200,
  20
FROM public.equipment e
WHERE e.slot = 'armor'
ORDER BY e.price ASC
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.recipes (name, equipment_id, ingredients, unlock_condition, base_gold_cost, sort_order)
SELECT
  'Forged ' || e.name,
  e.id,
  '[{"name":"Sage Stone","qty":3},{"name":"Vellum Page","qty":1}]'::jsonb,
  '{"level":5}'::jsonb,
  200,
  30
FROM public.equipment e
WHERE e.slot = 'helm'
ORDER BY e.price ASC
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.recipes (name, equipment_id, ingredients, unlock_condition, base_gold_cost, sort_order)
SELECT
  'Forged ' || e.name,
  e.id,
  '[{"name":"Wayfarer Stone","qty":3},{"name":"Tome Shard","qty":1}]'::jsonb,
  '{"level":10}'::jsonb,
  300,
  40
FROM public.equipment e
WHERE e.slot = 'accessory'
ORDER BY e.price ASC
LIMIT 1
ON CONFLICT DO NOTHING;

COMMIT;
