-- Migration: Database Indexes for RPC Optimization

CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON public.tasks (user_id) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_user_monsters_user ON public.user_monsters (user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_cron ON public.profiles (last_cron_date);
