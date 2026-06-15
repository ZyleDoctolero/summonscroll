-- ════════════════════════════════════════════════════════════════════════
-- score_task RPC — server authority for the core scoring loop.
--
-- The client (supabase-api.ts scoreTask) was refactored to call this RPC but
-- the function was never created → task scoring was broken at runtime.
-- This restores it server-side (anti-cheat: reward math lives in Postgres).
--
-- Returns JSON matching the client contract:
--   { success, message?, isPositive, gold_gained, xp_gained, crystal_gained,
--     hp_lost, died, drops:[{type,name}], bond_ticks:[{monster_name,stat}] }
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.score_task(p_task_id uuid, p_direction text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  t           public.tasks%ROWTYPE;
  p           public.profiles%ROWTYPE;
  v_mult      numeric;   -- difficulty multiplier
  v_is_pos    boolean;
  v_val       numeric;
  v_gold      int := 0;
  v_xp        int := 0;
  v_gems      int := 0;
  v_hp_change int := 0;  -- negative = damage
  v_streak    int;
  v_completed boolean;
  v_lcd       date;
  v_today     date := (now() at time zone 'utc')::date;
  v_talents   jsonb;
  v_greed     numeric; v_scholar numeric; v_resil numeric; v_collector numeric;
  v_combo     int;
  v_last_task timestamptz;
  v_combo_mult numeric;
  v_new_gold  int; v_new_crystals int; v_new_hp int; v_new_xp int; v_new_level int; v_deaths int;
  v_leveled   boolean := false;
  v_died      boolean := false;
  v_drop      jsonb := NULL;
  v_drop_roll numeric;
  v_per_bonus numeric;
  v_bond_ticks jsonb := '[]'::jsonb;
  v_stat_tags text[];
  m           record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT * INTO t FROM public.tasks WHERE id = p_task_id AND user_id = v_uid;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;

  SELECT * INTO p FROM public.profiles WHERE id = v_uid;

  v_mult := CASE t.difficulty
    WHEN 'trivial' THEN 0.1 WHEN 'easy' THEN 1 WHEN 'medium' THEN 1.5 WHEN 'hard' THEN 2 ELSE 1 END;
  v_val := COALESCE(t.value, 0);
  v_streak := COALESCE(t.streak, 0);
  v_completed := COALESCE(t.completed, false);
  v_lcd := t.last_completed_date;
  v_is_pos := p_direction IN ('plus', 'complete');

  -- talents
  v_talents   := COALESCE(p.talents, '{}'::jsonb);
  v_greed     := 1 + COALESCE((v_talents->>'greed')::numeric, 0) * 0.05;
  v_scholar   := 1 + COALESCE((v_talents->>'scholar')::numeric, 0) * 0.05;
  v_resil     := 1 - COALESCE((v_talents->>'resilience')::numeric, 0) * 0.10;
  v_collector := 1 + COALESCE((v_talents->>'collector')::numeric, 0) * 0.05;

  -- direction logic (mirrors constants.ts)
  IF p_direction = 'plus' THEN
    IF NOT t.positive_enabled THEN RETURN json_build_object('success', false, 'message', 'Positive disabled'); END IF;
    v_val := least(20, v_val + greatest(0.2, 1 - greatest(0, v_val) * 0.05));
    v_gold := round(greatest(1, round((3 + (10 - COALESCE(t.value,0)) * 0.7) * v_mult)) * v_greed);
    v_xp   := round(greatest(1, round((5 + (10 - COALESCE(t.value,0)) * 0.5) * v_mult)) * v_scholar);
    v_gems := CASE WHEN random() < 0.25 THEN greatest(0, round((1 + (10 - COALESCE(t.value,0)) * 0.15) * v_mult)) ELSE 0 END;
    v_streak := v_streak + 1;
  ELSIF p_direction = 'minus' THEN
    IF NOT t.negative_enabled THEN RETURN json_build_object('success', false, 'message', 'Negative disabled'); END IF;
    v_val := greatest(-20, v_val - greatest(0.2, 1 + greatest(0, -v_val) * 0.05));
    v_hp_change := -round(greatest(1, round((1 - COALESCE(t.value,0) / 20.0) * v_mult * 2 * (1 - least(0.4, COALESCE(p.con_stat,0) * 0.01)))) * v_resil);
    v_streak := 0;
  ELSIF p_direction = 'complete' THEN
    IF v_completed THEN RETURN json_build_object('success', true, 'noop', true, 'isPositive', true, 'died', false, 'gold_gained',0,'xp_gained',0,'crystal_gained',0,'hp_lost',0,'drops','[]'::json,'bond_ticks','[]'::json); END IF;
    v_val := least(20, v_val + greatest(0.2, 1 - greatest(0, v_val) * 0.05));
    v_gold := round(greatest(1, round((3 + (10 - COALESCE(t.value,0)) * 0.7) * v_mult)) * v_greed);
    v_xp   := round(greatest(1, round((5 + (10 - COALESCE(t.value,0)) * 0.5) * v_mult)) * v_scholar);
    v_gems := CASE WHEN random() < 0.3 THEN greatest(0, round((1 + (10 - COALESCE(t.value,0)) * 0.15) * v_mult)) ELSE 0 END;
    v_completed := true; v_lcd := v_today;
    IF t.type = 'daily' THEN v_streak := v_streak + 1; END IF;
  ELSIF p_direction = 'uncomplete' THEN
    IF NOT v_completed THEN RETURN json_build_object('success', true, 'noop', true, 'isPositive', false, 'died', false, 'gold_gained',0,'xp_gained',0,'crystal_gained',0,'hp_lost',0,'drops','[]'::json,'bond_ticks','[]'::json); END IF;
    v_val := greatest(-20, v_val - greatest(0.2, 1 + greatest(0, -v_val) * 0.05));
    v_gold := -greatest(1, round((3 + (10 - COALESCE(t.value,0)) * 0.7) * v_mult));
    v_xp   := -least(COALESCE(p.xp,0), greatest(1, round((5 + (10 - COALESCE(t.value,0)) * 0.5) * v_mult)));
    v_completed := false; v_lcd := NULL;
    v_streak := greatest(0, v_streak - 1);
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid direction');
  END IF;

  -- combo + starred (positive only)
  IF v_is_pos THEN
    v_combo := COALESCE(p.combo_count, 0);
    v_last_task := p.last_task_time;
    IF v_last_task IS NOT NULL AND (now() - v_last_task) < interval '1 hour' THEN
      v_combo := v_combo + 1;
    ELSE
      v_combo := 1;
    END IF;
    v_combo_mult := 1 + least(0.5, v_combo * 0.05);
    v_gold := round(v_gold * v_combo_mult);
    v_xp   := round(v_xp * v_combo_mult);
    IF COALESCE(t.is_starred, false) THEN
      v_gold := round(v_gold * 1.5);
      v_xp   := round(v_xp * 1.5);
    END IF;
  ELSE
    v_combo := COALESCE(p.combo_count, 0);
  END IF;

  -- update task
  UPDATE public.tasks
     SET value = v_val, streak = v_streak, completed = v_completed,
         last_completed_date = v_lcd,
         last_completed_at = CASE WHEN v_is_pos THEN now() ELSE last_completed_at END
   WHERE id = p_task_id;

  -- compute profile deltas
  v_new_gold := greatest(0, COALESCE(p.gold,0) + v_gold);
  v_new_crystals := greatest(0, COALESCE(p.crystals,0) + v_gems);
  v_new_hp := greatest(0, least(p.max_hp, COALESCE(p.hp,0) + v_hp_change));
  v_new_xp := greatest(0, COALESCE(p.xp,0) + v_xp);
  v_new_level := p.level;
  v_deaths := COALESCE(p.deaths,0);

  -- level ups
  WHILE v_new_xp >= round(25 + (v_new_level - 1) * 12) LOOP
    v_new_xp := v_new_xp - round(25 + (v_new_level - 1) * 12);
    v_new_level := v_new_level + 1;
    v_new_hp := p.max_hp;
    v_leveled := true;
  END LOOP;

  -- death
  IF v_new_hp <= 0 THEN
    v_died := true;
    v_new_level := greatest(1, v_new_level - 1);
    v_new_xp := 0; v_new_gold := 0; v_new_hp := p.max_hp;
    v_deaths := v_deaths + 1;
  END IF;

  UPDATE public.profiles
     SET gold = v_new_gold, crystals = v_new_crystals, hp = v_new_hp,
         xp = v_new_xp, level = v_new_level, deaths = v_deaths,
         combo_count = v_combo, last_task_time = CASE WHEN v_is_pos THEN now() ELSE last_task_time END
   WHERE id = v_uid;

  -- random drop (positive only)
  IF v_is_pos THEN
    v_per_bonus := 1 + COALESCE(p.per_stat,0) * 0.005;
    v_drop_roll := random() / (v_per_bonus * v_collector);
    IF v_drop_roll < 0.03 THEN
      v_drop := jsonb_build_object('type','egg','name',(ARRAY['Wolf','Dragon','Phoenix','Serpent','Griffin','Owl','Bear','Fox'])[floor(random()*8+1)] || ' Egg');
    ELSIF v_drop_roll < 0.06 THEN
      v_drop := jsonb_build_object('type','realm_potion','name',(ARRAY['Arcane','Chaos','Void','Death','Nature','Divine','Dread','Digital'])[floor(random()*8+1)] || ' Potion');
    ELSIF v_drop_roll < 0.10 THEN
      v_drop := jsonb_build_object('type','food','name',(ARRAY['Meat','Fish','Fruit','Cheese','Honey'])[floor(random()*5+1)]);
    ELSIF v_drop_roll < 0.15 THEN
      v_drop := jsonb_build_object('type','material','name',(ARRAY['Iron Ore','Shadow Essence','Void Core','Light Crystal'])[floor(random()*4+1)]);
    END IF;
    IF v_drop IS NOT NULL THEN
      INSERT INTO public.inventory (user_id, item_type, item_name, quantity)
      VALUES (v_uid, v_drop->>'type', v_drop->>'name', 1)
      ON CONFLICT DO NOTHING;
      -- upsert quantity if row already existed
      UPDATE public.inventory SET quantity = quantity + 1
       WHERE user_id = v_uid AND item_type = v_drop->>'type' AND item_name = v_drop->>'name'
         AND NOT EXISTS (SELECT 1 FROM public.inventory i2 WHERE i2.user_id=v_uid AND i2.item_type=v_drop->>'type' AND i2.item_name=v_drop->>'name' AND i2.id <> public.inventory.id);
    END IF;

    -- bond ticks: team monsters whose role-stat matches a str/int/con/per task tag
    v_stat_tags := ARRAY(SELECT lower(tag) FROM unnest(COALESCE(t.tags,'{}')) AS tag WHERE lower(tag) IN ('str','int','con','per'));
    IF array_length(v_stat_tags,1) > 0 THEN
      FOR m IN
        SELECT um.id, mo.name AS monster_name,
               CASE mo.role WHEN 'attacker' THEN 'str' WHEN 'tank' THEN 'con' WHEN 'healer' THEN 'con'
                            WHEN 'support' THEN 'int' WHEN 'debuffer' THEN 'per' ELSE 'str' END AS stat,
               um.bond_percent, um.growth_xp
          FROM public.user_monsters um JOIN public.monsters mo ON mo.id = um.monster_id
         WHERE um.user_id = v_uid
      LOOP
        IF m.stat = ANY(v_stat_tags) THEN
          UPDATE public.user_monsters
             SET bond_percent = least(100, COALESCE(m.bond_percent,0) + 0.5),
                 growth_xp = COALESCE(m.growth_xp,0) + 1
           WHERE id = m.id;
          v_bond_ticks := v_bond_ticks || jsonb_build_object('monster_name', m.monster_name, 'stat', m.stat);
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'isPositive', v_is_pos,
    'gold_gained', v_gold,
    'xp_gained', v_xp,
    'crystal_gained', v_gems,
    'hp_lost', -v_hp_change,
    'died', v_died,
    'leveled_up', v_leveled,
    'new_level', v_new_level,
    'streak', v_streak,
    'drops', CASE WHEN v_drop IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(v_drop) END,
    'bond_ticks', v_bond_ticks
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.score_task(uuid, text) TO authenticated;
