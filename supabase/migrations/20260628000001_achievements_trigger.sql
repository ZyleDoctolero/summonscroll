-- Trigger for achievements sync

CREATE OR REPLACE FUNCTION sync_achievements_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
  v_achievement RECORD;
BEGIN
  -- Count events for this user
  SELECT COUNT(*) INTO v_count FROM task_events WHERE user_id = NEW.user_id AND kind IN ('complete', 'plus');
  
  -- Check against thresholds
  FOR v_achievement IN 
    SELECT id, unlock_threshold, reward_crystals 
    FROM achievements 
    WHERE condition_type = 'tasks_completed'
  LOOP
    IF v_count >= v_achievement.unlock_threshold THEN
      -- Try to insert to user_achievements if not exists
      IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = NEW.user_id AND achievement_id = v_achievement.id) THEN
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) 
        VALUES (NEW.user_id, v_achievement.id, NOW());
        
        -- Give reward
        UPDATE profiles SET crystals = crystals + v_achievement.reward_crystals WHERE id = NEW.user_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_achievements ON task_events;
CREATE TRIGGER trg_sync_achievements
AFTER INSERT ON task_events
FOR EACH ROW
EXECUTE FUNCTION sync_achievements_trigger();
