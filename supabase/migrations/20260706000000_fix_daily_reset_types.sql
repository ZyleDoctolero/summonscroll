-- Fix run_daily_reset type errors that made the daily-cron edge function
-- return 400 for any user with prior activity:
--   * last_cron_date >= p_today            -> date >= text  (42883)
--   * last_completed_date < v_day::text    -> date < text   (42883)
--   * schedule_days @> to_jsonb(v_dow)     -> int[] @> jsonb (42883)

CREATE OR REPLACE FUNCTION public.run_daily_reset(p_user_id uuid, p_today text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile record;
  v_last_cron date;
  v_today_date date := p_today::date;
  v_diff int;
  v_days date[];
  v_day date;
  v_dow int;

  v_hp numeric;
  v_streak int;
  v_freezes int;
  v_con numeric;
  v_deaths int;

  v_hp_lost int := 0;
  v_missed_count int := 0;
  v_freeze_used_count int := 0;

  v_day_missed_count int;
  v_day_dmg numeric;

  v_task record;
  v_diff_mult numeric;
  v_con_red numeric;
  v_new_val numeric;

  v_sq_titles text[] := ARRAY['Complete 5 habits today', 'Win 2 Arena Battles', 'Score 3 Dailies', 'Level up a monster''s bond', 'Pull from the Altar'];
  v_chosen text[];

  v_died boolean := false;
BEGIN
  -- Lock profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_profile.last_cron_date IS NOT NULL AND v_profile.last_cron_date >= v_today_date THEN
    RETURN jsonb_build_object('ran', false, 'died', false, 'missedDailies', 0, 'hpLost', 0);
  END IF;

  v_hp := COALESCE(v_profile.hp, 0);
  v_streak := COALESCE(v_profile.streak, 0);
  v_freezes := COALESCE(v_profile.streak_freeze_charges, 0);
  v_con := COALESCE(v_profile.con_stat, 0);
  v_deaths := COALESCE(v_profile.deaths, 0);

  -- Calculate missing days
  v_last_cron := v_profile.last_cron_date::date;
  IF v_last_cron IS NOT NULL THEN
    v_diff := v_today_date - v_last_cron;
    v_diff := LEAST(14, v_diff);

    FOR i IN 1 .. (v_diff - 1) LOOP
      v_days := array_append(v_days, v_last_cron + i);
    END LOOP;
  END IF;

  IF array_length(v_days, 1) > 0 THEN
    -- Archive old side quests
    UPDATE public.tasks SET archived = true
    WHERE user_id = p_user_id AND category = 'side_quest' AND archived = false;

    FOR i IN 1 .. array_length(v_days, 1) LOOP
      v_day := v_days[i];
      v_dow := EXTRACT(DOW FROM v_day);

      v_day_missed_count := 0;
      v_day_dmg := 0;

      -- Find due dailies
      FOR v_task IN
        SELECT * FROM public.tasks
        WHERE user_id = p_user_id AND type = 'daily' AND archived = false
          AND (last_completed_date IS NULL OR last_completed_date < v_day)
      LOOP
        IF v_dow = ANY(v_task.schedule_days) THEN
          v_day_missed_count := v_day_missed_count + 1;
          v_diff_mult := CASE v_task.difficulty WHEN 'trivial' THEN 0.1 WHEN 'easy' THEN 1.0 WHEN 'medium' THEN 1.5 WHEN 'hard' THEN 2.0 ELSE 1.0 END;
          v_con_red := LEAST(0.4, v_con * 0.01);
          v_day_dmg := v_day_dmg + GREATEST(1.0, ROUND((1.0 - v_task.value / 20.0) * v_diff_mult * 2.0 * (1.0 - v_con_red)));
        END IF;
      END LOOP;

      IF v_day_missed_count > 0 THEN
        IF v_freezes > 0 THEN
          v_freezes := v_freezes - 1;
          v_freeze_used_count := v_freeze_used_count + 1;
          -- Streak intact, drift value
          FOR v_task IN SELECT * FROM public.tasks WHERE user_id = p_user_id AND type = 'daily' AND archived = false AND (last_completed_date IS NULL OR last_completed_date < v_day) LOOP
             IF v_dow = ANY(v_task.schedule_days) THEN
               v_diff_mult := CASE v_task.difficulty WHEN 'trivial' THEN 0.1 WHEN 'easy' THEN 1.0 WHEN 'medium' THEN 1.5 WHEN 'hard' THEN 2.0 ELSE 1.0 END;
               v_new_val := GREATEST(-20.0, v_task.value - 0.4 * v_diff_mult);
               UPDATE public.tasks SET value = v_new_val WHERE id = v_task.id;
             END IF;
          END LOOP;
        ELSE
          v_hp := GREATEST(0, v_hp - v_day_dmg);
          v_hp_lost := v_hp_lost + v_day_dmg;
          v_missed_count := v_missed_count + v_day_missed_count;
          -- Break streak, drift value
          FOR v_task IN SELECT * FROM public.tasks WHERE user_id = p_user_id AND type = 'daily' AND archived = false AND (last_completed_date IS NULL OR last_completed_date < v_day) LOOP
             IF v_dow = ANY(v_task.schedule_days) THEN
               v_diff_mult := CASE v_task.difficulty WHEN 'trivial' THEN 0.1 WHEN 'easy' THEN 1.0 WHEN 'medium' THEN 1.5 WHEN 'hard' THEN 2.0 ELSE 1.0 END;
               v_new_val := GREATEST(-20.0, v_task.value - 0.4 * v_diff_mult);
               UPDATE public.tasks SET value = v_new_val, streak = 0 WHERE id = v_task.id;
             END IF;
          END LOOP;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Reset today's dailies
  v_dow := EXTRACT(DOW FROM v_today_date);
  UPDATE public.tasks SET completed = false
  WHERE user_id = p_user_id AND type = 'daily' AND archived = false AND schedule_days @> ARRAY[v_dow];

  -- Update streak
  IF array_length(v_days, 1) > 0 THEN
    IF v_missed_count = 0 THEN
      v_streak := v_streak + array_length(v_days, 1);
    ELSE
      v_streak := 0;
    END IF;
  END IF;

  -- Generate side quests if none active
  IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE user_id = p_user_id AND category = 'side_quest' AND archived = false) THEN
    -- Pick 3 random quests
    SELECT array_agg(t) INTO v_chosen FROM (SELECT unnest(v_sq_titles) as t ORDER BY random() LIMIT 3) x;
    FOR i IN 1..3 LOOP
      INSERT INTO public.tasks (user_id, type, category, title, difficulty, value, sort_order)
      VALUES (p_user_id, 'todo', 'side_quest', v_chosen[i], 'medium', 0, i - 1);
    END LOOP;
  END IF;

  -- Death check
  IF v_hp <= 0 THEN
    v_died := true;
    UPDATE public.profiles SET
      level = GREATEST(1, COALESCE(level, 1) - 1),
      xp = 0,
      gold = ROUND(COALESCE(gold, 0) * 0.5), -- Halve gold on death
      hp = COALESCE(max_hp, 50),
      deaths = v_deaths + 1,
      streak = v_streak,
      streak_freeze_charges = v_freezes,
      last_cron_date = v_today_date,
      last_login_date = v_today_date
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles SET
      hp = v_hp,
      streak = v_streak,
      streak_freeze_charges = v_freezes,
      last_cron_date = v_today_date,
      last_login_date = v_today_date
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'ran', true,
    'died', v_died,
    'missedDailies', v_missed_count,
    'hpLost', v_hp_lost,
    'freezesUsed', v_freeze_used_count
  );
END;
$$;
