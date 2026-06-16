-- ==============================================================================
-- Phase 2: Missing Logic Endpoints (Evolution, Ascension, Expeditions, Soul Load)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Idle Expeditions (Dispatch & Claim)
-- ------------------------------------------------------------------------------

-- Dispatch
CREATE OR REPLACE FUNCTION public.dispatch_expedition(
  p_monster_id uuid,
  p_realm_name text,
  p_duration_minutes int,
  p_stamina_cost int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_stamina int;
  v_expedition_id uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;

  -- Check stamina
  SELECT stamina INTO v_stamina FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_stamina < p_stamina_cost THEN
    RETURN json_build_object('success', false, 'error', 'Not enough stamina');
  END IF;

  -- Deduct stamina
  UPDATE public.profiles SET stamina = stamina - p_stamina_cost WHERE id = v_uid;

  -- Insert expedition
  INSERT INTO public.idle_expeditions (user_id, user_monster_id, realm_name, duration_minutes, start_time, completed, claimed)
  VALUES (v_uid, p_monster_id, p_realm_name, p_duration_minutes, now(), false, false)
  RETURNING id INTO v_expedition_id;

  RETURN json_build_object('success', true, 'expedition_id', v_expedition_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.dispatch_expedition(uuid, text, int, int) TO authenticated;

-- Claim
CREATE OR REPLACE FUNCTION public.claim_expedition(
  p_expedition_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exp public.idle_expeditions%ROWTYPE;
  v_crystals_reward int := 0;
  v_gold_reward int := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_exp FROM public.idle_expeditions WHERE id = p_expedition_id AND user_id = v_uid FOR UPDATE;
  
  IF v_exp IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Expedition not found');
  END IF;

  IF v_exp.claimed THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed');
  END IF;

  -- Check if time has passed
  IF now() < v_exp.start_time + (v_exp.duration_minutes || ' minutes')::interval THEN
    RETURN json_build_object('success', false, 'error', 'Expedition not finished');
  END IF;

  -- Calculate rewards based on duration
  v_crystals_reward := v_exp.duration_minutes * 2;
  v_gold_reward := v_exp.duration_minutes * 10;

  -- Update expedition
  UPDATE public.idle_expeditions 
  SET completed = true, claimed = true, rewards = jsonb_build_object('crystals', v_crystals_reward, 'gold', v_gold_reward)
  WHERE id = p_expedition_id;

  -- Give rewards
  UPDATE public.profiles 
  SET crystals = crystals + v_crystals_reward, gold = gold + v_gold_reward
  WHERE id = v_uid;

  RETURN json_build_object('success', true, 'crystals', v_crystals_reward, 'gold', v_gold_reward);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_expedition(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Star Ascension (Duplicate Fusion)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ascend_monster(
  p_base_id uuid,
  p_material_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_base public.user_monsters%ROWTYPE;
  v_material public.user_monsters%ROWTYPE;
  v_new_rating int;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;

  -- Lock rows to prevent race conditions
  SELECT * INTO v_base FROM public.user_monsters WHERE id = p_base_id AND user_id = v_uid FOR UPDATE;
  SELECT * INTO v_material FROM public.user_monsters WHERE id = p_material_id AND user_id = v_uid FOR UPDATE;

  IF v_base IS NULL OR v_material IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Monster not found');
  END IF;

  IF v_base.monster_id <> v_material.monster_id THEN
    RETURN json_build_object('success', false, 'error', 'Monsters must be identical');
  END IF;

  IF v_base.star_rating >= 5 THEN
    RETURN json_build_object('success', false, 'error', 'Already at max star rating');
  END IF;

  -- Delete material
  DELETE FROM public.user_monsters WHERE id = p_material_id;

  -- Upgrade base
  v_new_rating := v_base.star_rating + 1;
  UPDATE public.user_monsters SET star_rating = v_new_rating WHERE id = p_base_id;

  RETURN json_build_object('success', true, 'new_rating', v_new_rating);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ascend_monster(uuid, uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. Alchemy Evolution
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.evolve_monster(
  p_base_id uuid,
  p_recipe_id text,
  p_catalyst_name text,
  p_result_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_base public.user_monsters%ROWTYPE;
  v_inventory public.inventory%ROWTYPE;
  v_new_monster_id uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;

  -- Lock base monster
  SELECT * INTO v_base FROM public.user_monsters WHERE id = p_base_id AND user_id = v_uid FOR UPDATE;
  IF v_base IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Monster not found');
  END IF;

  -- Check and lock catalyst inventory
  SELECT * INTO v_inventory FROM public.inventory WHERE user_id = v_uid AND item_name = p_catalyst_name FOR UPDATE;
  IF v_inventory IS NULL OR v_inventory.quantity < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Missing catalyst');
  END IF;

  -- Deduct catalyst
  UPDATE public.inventory SET quantity = quantity - 1 WHERE id = v_inventory.id;
  DELETE FROM public.inventory WHERE id = v_inventory.id AND quantity <= 0;

  -- Find result monster ID
  SELECT id INTO v_new_monster_id FROM public.monsters WHERE name = p_result_name LIMIT 1;
  IF v_new_monster_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Result monster not found in database');
  END IF;

  -- Transform monster
  UPDATE public.user_monsters SET monster_id = v_new_monster_id WHERE id = p_base_id;

  RETURN json_build_object('success', true, 'new_monster_id', v_new_monster_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.evolve_monster(uuid, text, text, text) TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. Soul Load Binding & Max Capacity scaling
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bind_companion(
  p_slot text, -- 'weapon', 'armor', 'mount'
  p_monster_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_monster public.user_monsters%ROWTYPE;
  v_load_weapon int := 0;
  v_load_armor int := 0;
  v_load_mount int := 0;
  v_total_load int := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_slot NOT IN ('weapon', 'armor', 'mount') THEN RETURN json_build_object('success', false, 'error', 'Invalid slot'); END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF p_monster_id IS NOT NULL THEN
    SELECT * INTO v_monster FROM public.user_monsters WHERE id = p_monster_id AND user_id = v_uid;
    IF v_monster IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Monster not owned');
    END IF;
  END IF;

  -- Calculate current loads
  IF v_profile.equip_weapon_id IS NOT NULL THEN
    SELECT star_rating INTO v_load_weapon FROM public.user_monsters WHERE id = v_profile.equip_weapon_id;
  END IF;
  IF v_profile.equip_armor_id IS NOT NULL THEN
    SELECT star_rating INTO v_load_armor FROM public.user_monsters WHERE id = v_profile.equip_armor_id;
  END IF;
  IF v_profile.equip_mount_id IS NOT NULL THEN
    SELECT star_rating INTO v_load_mount FROM public.user_monsters WHERE id = v_profile.equip_mount_id;
  END IF;

  -- Swap out the load for the targeted slot
  IF p_slot = 'weapon' THEN
    v_load_weapon := COALESCE(v_monster.star_rating, 0);
  ELSIF p_slot = 'armor' THEN
    v_load_armor := COALESCE(v_monster.star_rating, 0);
  ELSIF p_slot = 'mount' THEN
    v_load_mount := COALESCE(v_monster.star_rating, 0);
  END IF;

  v_total_load := COALESCE(v_load_weapon,0) + COALESCE(v_load_armor,0) + COALESCE(v_load_mount,0);

  -- Scale max load by level
  v_profile.soul_load_max := 10 + floor(v_profile.level / 5);

  IF v_total_load > v_profile.soul_load_max THEN
    RETURN json_build_object('success', false, 'error', 'Exceeds max soul load capacity');
  END IF;

  -- Apply binding
  IF p_slot = 'weapon' THEN
    UPDATE public.profiles SET equip_weapon_id = p_monster_id, soul_load_current = v_total_load, soul_load_max = v_profile.soul_load_max WHERE id = v_uid;
  ELSIF p_slot = 'armor' THEN
    UPDATE public.profiles SET equip_armor_id = p_monster_id, soul_load_current = v_total_load, soul_load_max = v_profile.soul_load_max WHERE id = v_uid;
  ELSIF p_slot = 'mount' THEN
    UPDATE public.profiles SET equip_mount_id = p_monster_id, soul_load_current = v_total_load, soul_load_max = v_profile.soul_load_max WHERE id = v_uid;
  END IF;

  RETURN json_build_object('success', true, 'soul_load_current', v_total_load, 'soul_load_max', v_profile.soul_load_max);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bind_companion(text, uuid) TO authenticated;

-- Also update score_task so it scales Soul Load on level up
CREATE OR REPLACE FUNCTION public.score_task_level_up_fix()
RETURNS trigger AS $$
BEGIN
  -- When level increases, update soul_load_max
  IF NEW.level > OLD.level THEN
    NEW.soul_load_max := 10 + floor(NEW.level / 5);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_score_task_level_up_fix ON public.profiles;
CREATE TRIGGER tr_score_task_level_up_fix
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.score_task_level_up_fix();

COMMIT;
