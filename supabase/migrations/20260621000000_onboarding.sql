-- ────────────────────────────────────────────────────────────────────────────
-- Onboarding Columns: First-Time Experience
--   • profiles.onboarding_completed_at: timestamp when onboarding flow completes
--   • profiles.tutorial_directive_id: FK to the seeded tutorial task
--     - Used to highlight the tutorial task with glow effect
--     - Cleared after first task score
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Add onboarding tracking columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS tutorial_directive_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Create index for quick onboarding status checks
CREATE INDEX IF NOT EXISTS profiles_onboarding_idx
  ON public.profiles(onboarding_completed_at)
  WHERE onboarding_completed_at IS NULL;

-- Create index for tutorial directive lookups
CREATE INDEX IF NOT EXISTS profiles_tutorial_directive_idx
  ON public.profiles(tutorial_directive_id)
  WHERE tutorial_directive_id IS NOT NULL;

COMMIT;
