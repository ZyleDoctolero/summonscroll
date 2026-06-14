-- Migration: Server-Side Monster Ascension (LOGIC-05)

CREATE OR REPLACE FUNCTION public.ascend_monster(p_user_monster_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_um record;
  v_m record;
  v_role text;
  v_from_star int;
  v_to_star int;
  v_gold_cost int;
  v_stone_name text;
  v_stone_qty int;
  v_dupes_needed int;
  v_dupes_burned int := 0;
  v_dupe record;
  v_profile record;
  v_inv record;
  v_remaining int;
  v_consume int;
  v_mat_name text;
  v_mat_qty int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  SELECT * INTO v_um FROM public.user_monsters WHERE id = p_user_monster_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Monster not found'; END IF;
  IF v_um.user_id != v_user_id THEN RAISE EXCEPTION 'Not your monster'; END IF;

  SELECT * INTO v_m FROM public.monsters WHERE id = v_um.monster_id;
  v_role := v_m.role;
  v_from_star := v_um.star_level;

  v_stone_name := CASE v_role 
    WHEN 'attacker' THEN 'Strength Stone' 
    WHEN 'tank' THEN 'Hearth Stone' 
    WHEN 'healer' THEN 'Hearth Stone' 
    WHEN 'support' THEN 'Sage Stone' 
    WHEN 'debuffer' THEN 'Wayfarer Stone' 
    ELSE 'Strength Stone' END;

  v_mat_name := CASE v_role
    WHEN 'attacker' THEN 'Iron Shard'
    WHEN 'tank' THEN 'Granite Core'
    WHEN 'healer' THEN 'Granite Core'
    WHEN 'support' THEN 'Vellum Page'
    WHEN 'debuffer' THEN 'Tome Shard'
    ELSE 'Iron Shard' END;

  IF v_from_star = 1 THEN 
    v_to_star := 2; v_gold_cost := 500; v_stone_qty := 5; v_dupes_needed := 0; v_mat_qty := 0;
    IF v_um.level < 1 THEN RAISE EXCEPTION 'Level 1 required'; END IF;
  ELSIF v_from_star = 2 THEN 
    v_to_star := 3; v_gold_cost := 1500; v_stone_qty := 10; v_dupes_needed := 1; v_mat_qty := 0;
    IF v_um.level < 5 THEN RAISE EXCEPTION 'Level 5 required'; END IF;
  ELSIF v_from_star = 3 THEN 
    v_to_star := 4; v_gold_cost := 3000; v_stone_qty := 20; v_dupes_needed := 1; v_mat_qty := 1;
    IF v_um.level < 15 THEN RAISE EXCEPTION 'Level 15 required'; END IF;
  ELSIF v_from_star = 4 THEN 
    v_to_star := 5; v_gold_cost := 5000; v_stone_qty := 50; v_dupes_needed := 2; v_mat_qty := 2;
    IF v_um.level < 30 THEN RAISE EXCEPTION 'Level 30 required'; END IF;
  ELSIF v_from_star = 5 THEN 
    v_to_star := 6; v_gold_cost := 10000; v_stone_qty := 100; v_dupes_needed := 3; v_mat_qty := 5;
    IF v_um.level < 50 THEN RAISE EXCEPTION 'Level 50 required'; END IF;
  ELSIF v_from_star = 6 THEN
    v_to_star := 7; v_gold_cost := 25000; v_stone_qty := 100; v_dupes_needed := 5; v_mat_qty := 5;
    IF v_um.level < 70 THEN RAISE EXCEPTION 'Level 70 required'; END IF;
  ELSE RAISE EXCEPTION 'Cannot ascend further'; END IF;

  IF COALESCE(v_profile.gold, 0) < v_gold_cost THEN RAISE EXCEPTION 'Not enough Gold'; END IF;

  -- Check stones
  SELECT SUM(quantity) INTO v_remaining FROM public.inventory WHERE user_id = v_user_id AND item_name = v_stone_name;
  IF COALESCE(v_remaining, 0) < v_stone_qty THEN RAISE EXCEPTION 'Not enough %', v_stone_name; END IF;

  -- Check materials
  IF v_mat_qty > 0 THEN
    SELECT SUM(quantity) INTO v_remaining FROM public.inventory WHERE user_id = v_user_id AND item_name = v_mat_name;
    IF COALESCE(v_remaining, 0) < v_mat_qty THEN RAISE EXCEPTION 'Not enough %', v_mat_name; END IF;
  END IF;

  -- Check dupes
  IF v_dupes_needed > 0 THEN
    SELECT COUNT(*) INTO v_remaining FROM public.user_monsters 
    WHERE user_id = v_user_id AND monster_id = v_m.id AND id != v_um.id;
    IF COALESCE(v_remaining, 0) < v_dupes_needed THEN RAISE EXCEPTION 'Not enough duplicate copies'; END IF;
  END IF;

  -- Deduct gold
  UPDATE public.profiles SET gold = COALESCE(gold, 0) - v_gold_cost WHERE id = v_user_id;

  -- Deduct stone
  v_remaining := v_stone_qty;
  FOR v_inv IN SELECT id, quantity FROM public.inventory WHERE user_id = v_user_id AND item_name = v_stone_name ORDER BY quantity DESC LOOP
    IF v_remaining <= 0 THEN EXIT; END IF;
    v_consume := LEAST(v_remaining, v_inv.quantity);
    IF v_inv.quantity - v_consume = 0 THEN
      DELETE FROM public.inventory WHERE id = v_inv.id;
    ELSE
      UPDATE public.inventory SET quantity = v_inv.quantity - v_consume WHERE id = v_inv.id;
    END IF;
    v_remaining := v_remaining - v_consume;
  END LOOP;

  -- Deduct material
  IF v_mat_qty > 0 THEN
    v_remaining := v_mat_qty;
    FOR v_inv IN SELECT id, quantity FROM public.inventory WHERE user_id = v_user_id AND item_name = v_mat_name ORDER BY quantity DESC LOOP
      IF v_remaining <= 0 THEN EXIT; END IF;
      v_consume := LEAST(v_remaining, v_inv.quantity);
      IF v_inv.quantity - v_consume = 0 THEN
        DELETE FROM public.inventory WHERE id = v_inv.id;
      ELSE
        UPDATE public.inventory SET quantity = v_inv.quantity - v_consume WHERE id = v_inv.id;
      END IF;
      v_remaining := v_remaining - v_consume;
    END LOOP;
  END IF;

  -- Burn dupes
  IF v_dupes_needed > 0 THEN
    v_remaining := v_dupes_needed;
    FOR v_dupe IN SELECT id FROM public.user_monsters WHERE user_id = v_user_id AND monster_id = v_m.id AND id != v_um.id ORDER BY created_at ASC LOOP
      IF v_remaining <= 0 THEN EXIT; END IF;
      DELETE FROM public.user_monsters WHERE id = v_dupe.id;
      v_remaining := v_remaining - 1;
      v_dupes_burned := v_dupes_burned + 1;
    END LOOP;
  END IF;

  -- Ascend
  UPDATE public.user_monsters SET 
    star_level = v_to_star,
    level = 1 -- Reset base stats to new tier bounds
  WHERE id = v_um.id;

  RETURN jsonb_build_object('success', true, 'from', v_from_star, 'to', v_to_star, 'dupes_burned', v_dupes_burned);
END;
$$;
