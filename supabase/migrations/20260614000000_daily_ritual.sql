-- ────────────────────────────────────────────────────────────────────────────
-- Step 5: Daily Ritual (Pillar 1).
--   • daily_logs: one row per user/day, holds morning intents + evening reflection
--   • tasks.is_starred: today's ⭐ task marker (cleared at cron)
--   • profiles.ritual_streak: meta-streak for both-ritual days
--   • profiles.wind_down_hour: when evening ritual unlocks (default 21)
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ritual_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wind_down_hour int NOT NULL DEFAULT 21;

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  -- Morning ritual
  am_intent_task_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  am_completed_at timestamptz,
  -- Evening ritual
  pm_went_well text,
  pm_didnt_go text,
  pm_mood int,
  pm_energy int,
  pm_tomorrow_anchor_task_id uuid,
  pm_completed_at timestamptz,
  -- Rewards
  reflection_pull_granted boolean NOT NULL DEFAULT false,
  reflection_pull_used boolean NOT NULL DEFAULT false,
  tome_shard_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS daily_logs_user_idx
  ON public.daily_logs(user_id, log_date DESC);

GRANT SELECT, INSERT, UPDATE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_logs_select_own" ON public.daily_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "daily_logs_insert_own" ON public.daily_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_logs_update_own" ON public.daily_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reuse set_updated_at trigger (defined in earlier migrations)
CREATE TRIGGER daily_logs_set_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
