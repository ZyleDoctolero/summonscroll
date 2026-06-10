-- 1. Streak freeze charges on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_charges int NOT NULL DEFAULT 0;

-- 2. Class change cooldown
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_class_change timestamptz;

-- 3. Freeze Charm shop item (costs 1 Pact Seal)
INSERT INTO shop_items (name, description, category, price, currency, effect_type, effect_value, sort_order)
VALUES ('Freeze Charm', 'Preserves your streak when you miss a daily. Auto-consumed at cron.', 'potion', 1, 'pact_seals', 'streak_freeze', 1, 5)
ON CONFLICT DO NOTHING;
