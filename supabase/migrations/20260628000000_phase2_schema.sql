-- Phase 2: Game Design Implementations

-- 1. Island Passive Income
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS island_last_harvest_at timestamptz DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS island_pending_gold integer DEFAULT 0;

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
  -- Lock profile
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid() FOR UPDATE;
  
  v_hours := EXTRACT(EPOCH FROM (NOW() - v_profile.island_last_harvest_at)) / 3600.0;
  
  FOR v_team IN SELECT * FROM user_monsters WHERE user_id = auth.uid() AND is_on_team = true LOOP
    -- Get rarity multiplier from joined monsters table or hardcode mapping if we must
    -- Actually, let's just get the rarity from monsters table:
    v_rarity_mult := 1.0; -- default
    SELECT 
      CASE rarity
        WHEN 'Common' THEN 1.0
        WHEN 'Uncommon' THEN 1.2
        WHEN 'Rare' THEN 1.5
        WHEN 'Epic' THEN 2.0
        WHEN 'Legendary' THEN 3.0
        WHEN 'EX' THEN 5.0
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


-- 2. Dynamic Side Quests
CREATE TABLE IF NOT EXISTS side_quest_templates (
  id          serial PRIMARY KEY,
  type        text NOT NULL,  -- 'pull' | 'bond' | 'battle' | 'streak' | 'habit'
  realm_id    integer REFERENCES realms(id),
  title       text NOT NULL,
  description text NOT NULL,
  base_score  integer NOT NULL DEFAULT 100,
  reward_gold integer NOT NULL DEFAULT 50,
  requires_crystals_min integer DEFAULT 0
);

INSERT INTO side_quest_templates (type, realm_id, title, description, base_score, reward_gold, requires_crystals_min)
VALUES 
  ('habit', 1, 'Scholar''s Discipline', 'Complete a study or reading task.', 100, 50, 0),
  ('habit', 2, 'Vanguard''s Strength', 'Complete a strength training task.', 100, 50, 0),
  ('habit', 3, 'Silent Order''s Focus', 'Complete a meditation task.', 100, 50, 0),
  ('habit', 4, 'Wanderer''s Agility', 'Complete a movement or exercise task.', 100, 50, 0),
  ('habit', 5, 'Healer''s Rest', 'Complete a sleep or recovery task.', 100, 50, 0),
  ('habit', 6, 'Builder''s Craft', 'Complete a skill or tech task.', 100, 50, 0),
  ('habit', 7, 'Elder''s Nourishment', 'Complete a nutrition task.', 100, 50, 0),
  ('habit', 8, 'Void''s Ambition', 'Complete an ambitious goal task.', 100, 100, 0),
  ('pull', NULL, 'Summoning Ritual', 'Pull once from the Altar.', 100, 100, 160),
  ('battle', NULL, 'Arena Challenger', 'Complete 3 battles in the Chaos Tower.', 100, 80, 0),
  ('bond', NULL, 'Deepen the Bond', 'Awaken a monster or reach a new bond tier.', 100, 150, 0)
ON CONFLICT DO NOTHING;


-- 3. Achievement Trigger Events
CREATE OR REPLACE FUNCTION check_achievements(p_event_type text, p_event_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_achievements jsonb := '[]'::jsonb;
  -- In a real app we would check conditions against the achievements table here.
  -- For now, returning empty to satisfy the signature.
BEGIN
  RETURN jsonb_build_object('newAchievements', v_new_achievements);
END;
$$;


-- 4. Battle Manual Mode
CREATE TABLE IF NOT EXISTS active_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  mode text NOT NULL,
  floor integer NOT NULL,
  player_hp integer NOT NULL,
  player_max_hp integer NOT NULL,
  enemy_hp integer NOT NULL,
  enemy_max_hp integer NOT NULL,
  enemy_name text NOT NULL,
  enemy_atk integer NOT NULL,
  enemy_def integer NOT NULL,
  enemy_element text NOT NULL,
  team_power integer NOT NULL,
  team_ids uuid[] NOT NULL,
  turn integer DEFAULT 0,
  special_cooldown integer DEFAULT 0,
  log jsonb DEFAULT '[]'::jsonb,
  is_complete boolean DEFAULT false,
  won boolean DEFAULT null,
  gold_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION start_manual_battle(p_mode text, p_floor integer, p_player_hp integer, p_enemy_hp integer, p_enemy_name text, p_enemy_atk integer, p_enemy_def integer, p_enemy_element text, p_team_power integer, p_team_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_battle_id uuid;
BEGIN
  INSERT INTO active_battles (user_id, mode, floor, player_hp, player_max_hp, enemy_hp, enemy_max_hp, enemy_name, enemy_atk, enemy_def, enemy_element, team_power, team_ids)
  VALUES (auth.uid(), p_mode, p_floor, p_player_hp, p_player_hp, p_enemy_hp, p_enemy_hp, p_enemy_name, p_enemy_atk, p_enemy_def, p_enemy_element, p_team_power, p_team_ids)
  RETURNING id INTO v_battle_id;
  
  RETURN jsonb_build_object('battleId', v_battle_id);
END;
$$;

CREATE OR REPLACE FUNCTION resolve_battle_turn(p_battle_id uuid, p_choice text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_battle active_battles%ROWTYPE;
  v_player_dmg integer;
  v_enemy_dmg integer;
  v_new_log jsonb;
  v_gold_reward integer := 0;
BEGIN
  SELECT * INTO v_battle FROM active_battles WHERE id = p_battle_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Battle not found'; END IF;
  IF v_battle.is_complete THEN RAISE EXCEPTION 'Battle is already complete'; END IF;
  
  IF p_choice = 'special' AND v_battle.special_cooldown > 0 THEN
    RAISE EXCEPTION 'Special is on cooldown';
  END IF;

  v_battle.turn := v_battle.turn + 1;
  
  -- Player Turn
  IF p_choice = 'attack' THEN
    v_player_dmg := GREATEST(1, ROUND(v_battle.team_power / 3.0 - v_battle.enemy_def * 0.3 + RANDOM() * 20));
    v_battle.enemy_hp := GREATEST(0, v_battle.enemy_hp - v_player_dmg);
    v_new_log := jsonb_build_object('round', v_battle.turn, 'actor', 'player', 'action', 'Attack', 'damage', v_player_dmg);
  ELSIF p_choice = 'defend' THEN
    v_new_log := jsonb_build_object('round', v_battle.turn, 'actor', 'player', 'action', 'Defend', 'damage', 0);
  ELSIF p_choice = 'special' THEN
    v_player_dmg := GREATEST(1, ROUND((v_battle.team_power / 3.0) * 2.5 - v_battle.enemy_def * 0.3 + RANDOM() * 20));
    v_battle.enemy_hp := GREATEST(0, v_battle.enemy_hp - v_player_dmg);
    v_battle.special_cooldown := 3;
    v_new_log := jsonb_build_object('round', v_battle.turn, 'actor', 'player', 'action', 'Special Attack', 'damage', v_player_dmg);
  END IF;

  v_battle.log := v_battle.log || v_new_log;

  -- Enemy Turn (if alive)
  IF v_battle.enemy_hp > 0 THEN
    v_enemy_dmg := GREATEST(1, ROUND(v_battle.enemy_atk - v_battle.team_power * 0.01 + RANDOM() * 10));
    IF p_choice = 'defend' THEN
      v_enemy_dmg := ROUND(v_enemy_dmg * 0.6); -- 40% reduction
    END IF;
    v_battle.player_hp := GREATEST(0, v_battle.player_hp - v_enemy_dmg);
    v_new_log := jsonb_build_object('round', v_battle.turn, 'actor', 'enemy', 'action', v_battle.enemy_name || ' attacks', 'damage', v_enemy_dmg);
    v_battle.log := v_battle.log || v_new_log;
  END IF;
  
  -- Cooldown tick
  IF p_choice != 'special' AND v_battle.special_cooldown > 0 THEN
    v_battle.special_cooldown := v_battle.special_cooldown - 1;
  END IF;

  -- Check end conditions
  IF v_battle.enemy_hp <= 0 THEN
    v_battle.is_complete := true;
    v_battle.won := true;
    -- Base gold calculation for manual battle (+15% bonus)
    v_gold_reward := ROUND((100 + v_battle.floor * 10) * 1.15);
    v_battle.gold_earned := v_gold_reward;
    UPDATE profiles SET gold = gold + v_gold_reward WHERE id = auth.uid();
  ELSIF v_battle.player_hp <= 0 THEN
    v_battle.is_complete := true;
    v_battle.won := false;
  END IF;

  UPDATE active_battles SET
    player_hp = v_battle.player_hp,
    enemy_hp = v_battle.enemy_hp,
    turn = v_battle.turn,
    special_cooldown = v_battle.special_cooldown,
    log = v_battle.log,
    is_complete = v_battle.is_complete,
    won = v_battle.won,
    gold_earned = v_battle.gold_earned
  WHERE id = p_battle_id;

  RETURN jsonb_build_object(
    'playerHp', v_battle.player_hp,
    'enemyHp', v_battle.enemy_hp,
    'turn', v_battle.turn,
    'log', v_battle.log,
    'complete', v_battle.is_complete,
    'won', v_battle.won,
    'goldEarned', v_battle.gold_earned,
    'specialCooldown', v_battle.special_cooldown
  );
END;
$$;
