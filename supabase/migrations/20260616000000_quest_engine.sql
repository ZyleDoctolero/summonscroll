-- ────────────────────────────────────────────────────────────────────────────
-- Step 7: Quest Engine — Goals (quarterly/monthly/weekly) + Tome reward.
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE TYPE public.goal_type AS ENUM ('quarterly', 'monthly', 'weekly');
CREATE TYPE public.goal_status AS ENUM ('active', 'slain', 'expired');

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  identity text,                                -- optional identity tag (Writer, Athlete, ...)
  type public.goal_type NOT NULL,
  status public.goal_status NOT NULL DEFAULT 'active',
  hp_total int NOT NULL,
  hp_remaining int NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  deadline timestamptz NOT NULL,
  slain_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX goals_user_idx ON public.goals(user_id, status, deadline);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own" ON public.goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Link tasks to a goal (optional)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

COMMIT;
