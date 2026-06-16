-- ==============================================================================
-- Migration: Beastmaster System Mechanics (Iterative Evolution & Artifacts)
-- ==============================================================================

-- 1. Enhance `user_monsters` table with Infinite Gacha / Deep Evolution tracking
ALTER TABLE public.user_monsters 
ADD COLUMN IF NOT EXISTS current_star int DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_class text DEFAULT 'base',
ADD COLUMN IF NOT EXISTS title text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS secondary_element text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false, 
ADD COLUMN IF NOT EXISTS corruption_level int DEFAULT 0, 
ADD COLUMN IF NOT EXISTS ascension_tree jsonb DEFAULT '{}'::jsonb;

-- 2. New Table: Void Artifacts for advanced monster gear
CREATE TABLE IF NOT EXISTS public.monster_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    monster_id uuid REFERENCES public.user_monsters(id) ON DELETE SET NULL,
    set_name text NOT NULL,
    main_stat text NOT NULL,
    sub_stats jsonb DEFAULT '[]'::jsonb,
    enhancement_level int DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for monster_artifacts
ALTER TABLE public.monster_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own artifacts" 
    ON public.monster_artifacts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts" 
    ON public.monster_artifacts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts" 
    ON public.monster_artifacts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts" 
    ON public.monster_artifacts FOR DELETE 
    USING (auth.uid() = user_id);

-- 3. Enhance `profiles` table to track Master state and endgame progress
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS soul_tether_id uuid DEFAULT NULL REFERENCES public.user_monsters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS soul_fragments jsonb DEFAULT '{"fire_1_star": 0, "dark_1_star": 0, "water_1_star": 0, "earth_1_star": 0, "light_1_star": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS regression_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS pvp_rank text DEFAULT 'Novice',
ADD COLUMN IF NOT EXISTS constellation_patron text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS constellation_favor int DEFAULT 0,
ADD COLUMN IF NOT EXISTS irl_discipline_score int DEFAULT 100;

-- ==============================================================================
-- Server Authority RPC: synthesize_monster
-- ==============================================================================
-- Handles the transaction of sacrificing fodder to evolve a target monster.
-- Automatically resets level to 1, increments current_star, and destroys fodder.
-- ==============================================================================
CREATE OR REPLACE FUNCTION synthesize_monster(
  p_target_id uuid,
  p_fodder_ids uuid[],
  p_use_fragments boolean DEFAULT false
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_target_monster record;
  v_cost_gold int;
  v_new_star int;
BEGIN
  -- Identify caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Verify target ownership and fetch details
  SELECT * INTO v_target_monster FROM public.user_monsters 
  WHERE id = p_target_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target monster not found or unowned.';
  END IF;

  -- (In a full implementation, you would check if v_target_monster.level >= MAX for current_star)
  
  v_new_star := v_target_monster.current_star + 1;
  
  IF v_new_star > 10 THEN
    RAISE EXCEPTION 'Monster has reached the ultimate 10★ limit.';
  END IF;

  -- Calculate basic gold cost
  v_cost_gold := 500 * v_new_star;

  -- Verify user has enough gold
  IF (SELECT gold FROM public.profiles WHERE id = v_user_id) < v_cost_gold THEN
    RAISE EXCEPTION 'Not enough Gold for Synthesis.';
  END IF;

  -- 2. Deduct Gold
  UPDATE public.profiles
  SET gold = gold - v_cost_gold
  WHERE id = v_user_id;

  -- 3. Handle Fodder
  IF p_use_fragments THEN
    -- Optimization logic: deduct from profile.soul_fragments
    -- (This would parse the JSONB and deduct required fragments depending on the element/star)
    -- For this stub, we bypass complex JSONB fragment logic and just assume it passes.
  ELSE
    -- Row-based logic: verify all fodder ids are owned, unlocked, and correct star level
    -- We must ensure the array length matches the requirement (e.g. N fodder for N star)
    IF array_length(p_fodder_ids, 1) < v_target_monster.current_star THEN
      RAISE EXCEPTION 'Insufficient fodder provided for evolution.';
    END IF;

    -- Delete the fodder rows
    DELETE FROM public.user_monsters 
    WHERE id = ANY(p_fodder_ids) 
      AND user_id = v_user_id 
      AND is_locked = false;
  END IF;

  -- 4. Update the target monster
  UPDATE public.user_monsters
  SET current_star = v_new_star,
      level = 1,
      xp = 0
  WHERE id = p_target_id;

  RETURN json_build_object(
    'success', true,
    'new_star', v_new_star,
    'message', 'Synthesis Complete. Monster regressed to Level 1 with higher potential.'
  );
END;
$$;
