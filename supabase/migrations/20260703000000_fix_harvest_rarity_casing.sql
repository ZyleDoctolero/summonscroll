-- Fix harvest_island rarity CASE to match the lowercase monster_rarity enum.
CREATE OR REPLACE FUNCTION harvest_island()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_team user_monsters%ROWTYPE;
  v_hours numeric;
  v_generated_gold numeric := 0;
  v_rarity_mult numeric;
  v_total_gold integer;
  v_whisper_monster_name text := NULL;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid() FOR UPDATE;

  v_hours := EXTRACT(EPOCH FROM (NOW() - v_profile.island_last_harvest_at)) / 3600.0;

  FOR v_team IN SELECT * FROM user_monsters WHERE user_id = auth.uid() AND is_on_team = true LOOP
    v_rarity_mult := 1.0;
    SELECT
      CASE rarity
        WHEN 'common' THEN 1.0
        WHEN 'uncommon' THEN 1.2
        WHEN 'rare' THEN 1.5
        WHEN 'elite' THEN 1.8
        WHEN 'epic' THEN 2.0
        WHEN 'legendary' THEN 3.0
        WHEN 'mythic' THEN 4.0
        WHEN 'ex' THEN 5.0
        ELSE 1.0
      END INTO v_rarity_mult
    FROM monsters WHERE id = v_team.monster_id;

    v_generated_gold := v_generated_gold + ( (v_team.bond_percent / 100.0) * v_rarity_mult * 0.5 * v_hours );

    IF v_whisper_monster_name IS NULL AND RANDOM() > 0.5 THEN
      SELECT name INTO v_whisper_monster_name FROM monsters WHERE id = v_team.monster_id;
    END IF;
  END LOOP;

  v_total_gold := FLOOR(v_generated_gold) + v_profile.island_pending_gold;

  IF v_total_gold > 0 THEN
    UPDATE profiles
    SET gold = gold + v_total_gold,
        island_pending_gold = 0,
        island_last_harvest_at = NOW()
    WHERE id = auth.uid();
  ELSE
    UPDATE profiles
    SET island_last_harvest_at = NOW()
    WHERE id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'harvested', v_total_gold,
    'whisperName', v_whisper_monster_name
  );
END;
$$;
