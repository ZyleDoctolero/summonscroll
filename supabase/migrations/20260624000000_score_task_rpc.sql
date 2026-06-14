-- Migration: Server-Side Scoring & Drops (LOGIC-01, LOGIC-04, LOGIC-08)

CREATE TABLE IF NOT EXISTS public.drop_pool (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  item_name text not null,
  realm_id int references public.realms(id) on delete cascade,
  weight numeric not null default 10,
  min_quantity int not null default 1,
  max_quantity int not null default 1
);

-- Seed drop pool
INSERT INTO public.drop_pool (item_type, item_name, realm_id, weight) VALUES
  ('egg', 'Wolf Egg', null, 5),
  ('egg', 'Dragon Egg', null, 5),
  ('egg', 'Phoenix Egg', null, 5),
  ('food', 'Meat', null, 20),
  ('food', 'Fish', null, 20),
  ('material', 'Iron Ore', null, 30),
  ('realm_potion', 'Arcane Potion', 1, 10),
  ('realm_potion', 'Chaos Potion', 2, 10),
  ('realm_potion', 'Void Potion', 3, 10),
  ('realm_potion', 'Death Potion', 4, 10),
  ('realm_potion', 'Nature Potion', 5, 10);

CREATE OR REPLACE FUNCTION public.score_task(p_task_id uuid, p_direction text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_task record;
  v_profile record;
  v_diff_mult numeric;
  v_new_val numeric;
  v_gold_gain int := 0;
  v_xp_gain int := 0;
  v_gem_gain int := 0;
  v_hp_change int := 0;
  v_new_streak int;
  v_completed boolean;
  v_last_completed_date date;
  v_today date := current_date;
  v_is_positive boolean;
  v_greed_mult numeric;
  v_scholar_mult numeric;
  v_resilience_mult numeric;
  v_collector_mult numeric;
  v_con_red numeric;
  v_new_gold int;
  v_new_crystals int;
  v_new_hp int;
  v_new_xp int;
  v_new_level int;
  v_deaths int;
  v_died boolean := false;
  v_leveled_up boolean := false;
  v_drop jsonb := null;
  v_drops_arr jsonb := '[]'::jsonb;
  v_bond_ticks jsonb := '[]'::jsonb;
  v_combo_count int;
  v_last_task_time timestamptz;
  v_combo_mult numeric;
  
  -- drop roll variables
  v_per_bonus numeric;
  v_drop_roll numeric;
  v_drop_rec record;
  v_drop_qty int;
  
  -- bond tick variables
  v_um record;
  v_new_bond numeric;
  v_new_growth_xp int;
  v_bond_obj jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Lock task
  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  
  IF v_task.user_id != v_user_id THEN
    RAISE EXCEPTION 'Not your task';
  END IF;

  v_diff_mult := CASE v_task.difficulty
    WHEN 'trivial' THEN 0.1
    WHEN 'easy' THEN 1.0
    WHEN 'medium' THEN 1.5
    WHEN 'hard' THEN 2.0
    ELSE 1.0
  END;

  v_new_val := v_task.value;
  v_new_streak := COALESCE(v_task.streak, 0);
  v_completed := COALESCE(v_task.completed, false);
  v_last_completed_date := v_task.last_completed_date;
  
  -- Talents (JSONB)
  v_greed_mult := 1.0 + COALESCE((v_profile.talents->>'greed')::numeric, 0) * 0.05;
  v_scholar_mult := 1.0 + COALESCE((v_profile.talents->>'scholar')::numeric, 0) * 0.05;
  v_resilience_mult := 1.0 - COALESCE((v_profile.talents->>'resilience')::numeric, 0) * 0.1;
  v_collector_mult := 1.0 + COALESCE((v_profile.talents->>'collector')::numeric, 0) * 0.05;

  v_is_positive := p_direction = 'plus' OR p_direction = 'complete';

  IF p_direction = 'plus' THEN
    IF NOT COALESCE(v_task.positive_enabled, true) THEN RAISE EXCEPTION 'Positive disabled'; END IF;
    v_new_val := LEAST(20.0, v_new_val + GREATEST(0.2, 1.0 - GREATEST(0.0, v_new_val) * 0.05));
    v_gold_gain := GREATEST(1, ROUND((3.0 + (10.0 - v_task.value) * 0.7) * v_diff_mult)) * v_greed_mult;
    v_xp_gain := GREATEST(1, ROUND((5.0 + (10.0 - v_task.value) * 0.5) * v_diff_mult)) * v_scholar_mult;
    IF random() < 0.25 THEN
      v_gem_gain := GREATEST(0, ROUND((1.0 + (10.0 - v_task.value) * 0.15) * v_diff_mult));
    END IF;
    v_new_streak := v_new_streak + 1;
    
  ELSIF p_direction = 'minus' THEN
    IF NOT COALESCE(v_task.negative_enabled, true) THEN RAISE EXCEPTION 'Negative disabled'; END IF;
    v_new_val := GREATEST(-20.0, v_new_val - GREATEST(0.2, 1.0 + GREATEST(0.0, -v_new_val) * 0.05));
    v_con_red := LEAST(0.4, COALESCE(v_profile.con_stat, 0) * 0.01);
    v_hp_change := -GREATEST(1, ROUND((1.0 - v_task.value / 20.0) * v_diff_mult * 2.0 * (1.0 - v_con_red))) * v_resilience_mult;
    v_new_streak := 0;
    
  ELSIF p_direction = 'complete' THEN
    IF v_completed THEN
      RETURN jsonb_build_object('success', true, 'noop', true, 'isPositive', true);
    END IF;
    v_new_val := LEAST(20.0, v_new_val + GREATEST(0.2, 1.0 - GREATEST(0.0, v_new_val) * 0.05));
    v_gold_gain := GREATEST(1, ROUND((3.0 + (10.0 - v_task.value) * 0.7) * v_diff_mult)) * v_greed_mult;
    v_xp_gain := GREATEST(1, ROUND((5.0 + (10.0 - v_task.value) * 0.5) * v_diff_mult)) * v_scholar_mult;
    IF random() < 0.3 THEN
      v_gem_gain := GREATEST(0, ROUND((1.0 + (10.0 - v_task.value) * 0.15) * v_diff_mult));
    END IF;
    v_completed := true;
    v_last_completed_date := v_today;
    IF v_task.type = 'daily' THEN v_new_streak := v_new_streak + 1; END IF;
    
  ELSIF p_direction = 'uncomplete' THEN
    IF NOT v_completed THEN
      RETURN jsonb_build_object('success', true, 'noop', true, 'isPositive', false);
    END IF;
    v_new_val := GREATEST(-20.0, v_new_val - GREATEST(0.2, 1.0 + GREATEST(0.0, -v_new_val) * 0.05));
    v_gold_gain := -GREATEST(1, ROUND((3.0 + (10.0 - v_task.value) * 0.7) * v_diff_mult));
    v_xp_gain := -LEAST(v_profile.xp, GREATEST(1, ROUND((5.0 + (10.0 - v_task.value) * 0.5) * v_diff_mult)));
    v_completed := false;
    v_last_completed_date := null;
    v_new_streak := GREATEST(0, v_new_streak - 1);
    
  END IF;

  v_combo_count := COALESCE(v_profile.combo_count, 0);
  v_last_task_time := v_profile.last_task_time;

  IF v_is_positive THEN
    IF v_last_task_time IS NOT NULL AND EXTRACT(EPOCH FROM (now() - v_last_task_time)) < 3600 THEN
      v_combo_count := v_combo_count + 1;
    ELSE
      v_combo_count := 1;
    END IF;
    v_last_task_time := now();
    
    v_combo_mult := 1.0 + LEAST(0.5, v_combo_count * 0.05);
    v_gold_gain := ROUND(v_gold_gain * v_combo_mult);
    v_xp_gain := ROUND(v_xp_gain * v_combo_mult);
    
    IF v_task.is_starred THEN
      v_gold_gain := ROUND(v_gold_gain * 1.5);
      v_xp_gain := ROUND(v_xp_gain * 1.5);
    END IF;
  END IF;

  UPDATE public.tasks SET
    value = v_new_val,
    streak = v_new_streak,
    completed = v_completed,
    last_completed_date = v_last_completed_date,
    last_completed_at = CASE WHEN v_is_positive THEN now() ELSE v_task.last_completed_at END
  WHERE id = p_task_id;

  v_new_gold := GREATEST(0, COALESCE(v_profile.gold, 0) + v_gold_gain);
  v_new_crystals := GREATEST(0, COALESCE(v_profile.crystals, 0) + v_gem_gain);
  v_new_hp := GREATEST(0, LEAST(v_profile.max_hp, COALESCE(v_profile.hp, 0) + v_hp_change));
  v_new_level := COALESCE(v_profile.level, 1);
  v_new_xp := GREATEST(0, COALESCE(v_profile.xp, 0) + v_xp_gain);
  v_deaths := COALESCE(v_profile.deaths, 0);

  WHILE v_new_xp >= ROUND(25.0 + (v_new_level - 1) * 12.0) LOOP
    v_new_xp := v_new_xp - ROUND(25.0 + (v_new_level - 1) * 12.0);
    v_new_level := v_new_level + 1;
    v_new_hp := v_profile.max_hp;
    v_leveled_up := true;
  END LOOP;

  IF v_new_hp <= 0 THEN
    v_died := true;
    v_new_level := GREATEST(1, v_new_level - 1);
    v_new_xp := 0;
    -- LOGIC-08: Death checks deduct 50% gold. Crystals are non-reversable.
    v_new_gold := ROUND(v_new_gold * 0.5);
    v_new_hp := v_profile.max_hp;
    v_deaths := v_deaths + 1;
  END IF;

  UPDATE public.profiles SET
    gold = v_new_gold,
    crystals = v_new_crystals,
    hp = v_new_hp,
    xp = v_new_xp,
    level = v_new_level,
    deaths = v_deaths,
    combo_count = v_combo_count,
    last_task_time = v_last_task_time
  WHERE id = v_user_id;

  -- Drops (LOGIC-04)
  IF v_is_positive THEN
    v_per_bonus := 1.0 + COALESCE(v_profile.per_stat, 0) * 0.005;
    v_drop_roll := random() / (v_per_bonus * v_collector_mult);
    IF v_drop_roll < 0.25 THEN
      SELECT * INTO v_drop_rec FROM public.drop_pool 
      WHERE realm_id = v_task.realm_id OR realm_id IS NULL
      ORDER BY (realm_id = v_task.realm_id) DESC NULLS LAST, random() LIMIT 1;
      
      IF FOUND THEN
        v_drop_qty := FLOOR(random() * (v_drop_rec.max_quantity - v_drop_rec.min_quantity + 1)) + v_drop_rec.min_quantity;
        v_drop := jsonb_build_object(
          'item_id', v_drop_rec.id,
          'type', v_drop_rec.item_type,
          'name', v_drop_rec.item_name,
          'quantity', v_drop_qty,
          'rarity', 'common'
        );
        v_drops_arr := jsonb_build_array(v_drop);
        
        INSERT INTO public.inventory (user_id, item_type, item_name, quantity)
        VALUES (v_user_id, v_drop_rec.item_type, v_drop_rec.item_name, v_drop_qty)
        ON CONFLICT (user_id, item_type, item_name)
        DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity;
      END IF;
    END IF;
  END IF;

  -- Bond ticks (RULE 6 / INVARIANT 6 / LOGIC-01)
  IF v_is_positive THEN
    IF v_task.realm_id IS NOT NULL THEN
      FOR v_um IN 
        SELECT um.id, m.name as monster_name, um.bond_percent, um.growth_xp 
        FROM public.user_monsters um 
        JOIN public.monsters m ON um.monster_id = m.id
        WHERE um.user_id = v_user_id AND m.realm_id = v_task.realm_id
      LOOP
        v_new_bond := LEAST(100.0, v_um.bond_percent + 0.5);
        v_new_growth_xp := COALESCE(v_um.growth_xp, 0) + 1;
        UPDATE public.user_monsters SET bond_percent = v_new_bond, growth_xp = v_new_growth_xp WHERE id = v_um.id;
        v_bond_obj := jsonb_build_object(
          'monster_id', v_um.id,
          'monster_name', v_um.monster_name,
          'bond_gained', 0.5,
          'xp_gained', 1
        );
        v_bond_ticks := v_bond_ticks || v_bond_obj;
      END LOOP;
    ELSE
      FOR v_um IN 
        SELECT um.id, m.name as monster_name, um.bond_percent, um.growth_xp 
        FROM public.user_monsters um 
        JOIN public.monsters m ON um.monster_id = m.id
        WHERE um.user_id = v_user_id
      LOOP
        v_new_bond := LEAST(100.0, v_um.bond_percent + 0.05);
        UPDATE public.user_monsters SET bond_percent = v_new_bond WHERE id = v_um.id;
        v_bond_obj := jsonb_build_object(
          'monster_id', v_um.id,
          'monster_name', v_um.monster_name,
          'bond_gained', 0.05,
          'xp_gained', 0
        );
        v_bond_ticks := v_bond_ticks || v_bond_obj;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Task scored',
    'gold_gained', v_gold_gain,
    'xp_gained', v_xp_gain,
    'hp_lost', ABS(v_hp_change),
    'died', v_died,
    'drops', v_drops_arr,
    'crystal_gained', v_gem_gain > 0,
    'bond_ticks', v_bond_ticks
  );
END;
$$;
