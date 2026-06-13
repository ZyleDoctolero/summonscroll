// ────────────────────────────────────────────────────────────────────────────
// Onboarding Client: First-Time Experience
//
// Implements the tutorial directive seeding and profile update logic for new users.
// Called when the onboarding carousel completes (Onboarding component onComplete).
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "./constants";

/**
 * Complete onboarding flow
 *
 * Creates a tutorial directive ("Drink water (first habit)") and updates the
 * profile with onboarding_completed_at and tutorial_directive_id.
 *
 * The tutorial directive:
 * - Is a habit (type=habit)
 * - Has easy difficulty
 * - Is CON-tagged so it ticks monster bond when scored
 * - Has guidance notes explaining the cascade effect
 *
 * After this completes:
 * - The tutorial task appears in the user's task list with a glowing pulse (Task 9.4)
 * - The onboarding modal will not show again
 * - When the user scores the task, the free first pull modal appears (Task 9.5)
 *
 * Integration points:
 * - Called by Onboarding component's onComplete callback (Task 9.2)
 * - TaskCard checks profile.tutorial_directive_id to apply pulse effect (Task 9.4)
 * - gacha-client.ts checks for first pull to skip cost and guarantee Rare (Task 9.5)
 *
 * @returns The created task ID
 * @throws Error if not authenticated or database operations fail
 */
export async function completeOnboarding(): Promise<{ taskId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Create the tutorial directive
  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      type: "habit" as const,
      title: "Drink water (first habit)",
      notes: "Tap the [+] to score this habit. Watch what happens — this is the game loop.",
      category: "wellness",
      difficulty: "easy" as Difficulty,
      positive_enabled: true,
      negative_enabled: false,
      tags: ["con"], // CON-tagged so it ticks monster bond on completion
      value: 0,
      streak: 0,
      completed: false,
      is_starred: false,
      archived: false,
    })
    .select()
    .single();

  if (taskErr) throw taskErr;

  // 2. Update profile with onboarding completion timestamp and tutorial directive reference
  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      tutorial_directive_id: task.id,
    })
    .eq("id", user.id);

  if (profErr) throw profErr;

  return { taskId: task.id };
}

/**
 * Check if the user has completed onboarding
 *
 * @returns true if onboarding_completed_at is set, false otherwise
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.onboarding_completed_at != null;
}
