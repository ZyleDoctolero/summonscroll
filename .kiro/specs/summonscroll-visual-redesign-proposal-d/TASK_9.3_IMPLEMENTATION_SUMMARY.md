# Task 9.3 Implementation Summary: Tutorial Directive Seeding Logic

## Overview

Implemented backend logic to seed a tutorial directive when onboarding completes, as specified in Task 9.3 of the SummonScroll Visual Redesign spec.

## Files Created

### `src/lib/game/onboarding-client.ts`

New client module that handles onboarding completion logic:

**Functions:**

1. `completeOnboarding(): Promise<{ taskId: string }>`
   - Creates a tutorial directive ("Drink water (first habit)")
   - Updates profile with `onboarding_completed_at` timestamp
   - Updates profile with `tutorial_directive_id` reference
   - Returns the created task ID

2. `hasCompletedOnboarding(): Promise<boolean>`
   - Helper function to check if user has completed onboarding
   - Returns true if `onboarding_completed_at` is set

**Tutorial Directive Properties:**

- **Type:** habit
- **Title:** "Drink water (first habit)"
- **Notes:** "Tap the [+] to score this habit. Watch what happens — this is the game loop."
- **Category:** wellness
- **Difficulty:** easy
- **Tags:** ["con"] - ensures monster bond ticks when scored
- **Positive enabled:** true
- **Negative enabled:** false

## Files Modified

### `src/lib/game/supabase-api.ts`

Added exports for the new onboarding functions:

```typescript
export { completeOnboarding, hasCompletedOnboarding } from "./onboarding-client";
```

## Integration Points

This implementation is designed to integrate with:

1. **Task 9.2 (Onboarding Component):**
   - The `Onboarding` component will call `completeOnboarding()` in its `onComplete` callback
   - Usage: `import { completeOnboarding } from "@/lib/game/supabase-api"`

2. **Task 9.4 (Tutorial Pulse Effect):**
   - `TaskCard` component will check if `task.id === profile.tutorial_directive_id`
   - If true, applies glowing pulse animation
   - Pulse stops after first score

3. **Task 9.5 (Free First Pull):**
   - `gacha-client.ts` checks if this is the user's first pull
   - Skips cost and guarantees at least one Rare in the 10-pull
   - Follow-up modal appears after tutorial directive is scored

4. **Task 9.6 (Mounting):**
   - Hub route will conditionally render Onboarding based on `profile.onboarding_completed_at`

## Database Schema

The migration was already created in Task 9.1:

- **File:** `supabase/migrations/20260621000000_onboarding.sql`
- **Columns added to profiles table:**
  - `onboarding_completed_at: timestamptz` - timestamp when onboarding completes
  - `tutorial_directive_id: uuid` - FK reference to the tutorial task
- **Indexes:** Optimized lookups for onboarding status and tutorial directive

## Build Status

✅ **Build passes successfully** - verified with `npm run build`

## Success Criteria Met

✅ Tutorial directive creation logic implemented with appropriate text and metadata
✅ Profile update logic includes both `tutorial_directive_id` and `onboarding_completed_at`
✅ Function is exported and ready to be called from the Onboarding component
✅ Build passes without errors
✅ Code follows existing patterns from `rituals-client.ts` and `supabase-api.ts`

## Next Steps (for subsequent tasks)

1. **Task 9.4:** Add tutorial pulse effect to `TaskCard.tsx`
2. **Task 9.5:** Modify `gacha-client.ts` for free first pull + follow-up modal
3. **Task 9.6:** Mount Onboarding component conditionally in Hub route

## Testing Recommendations

When testing this feature end-to-end:

1. Create a test account with `onboarding_completed_at IS NULL`
2. Complete the onboarding carousel
3. Verify the tutorial task appears in the task list
4. Verify database columns are updated:
   ```sql
   SELECT onboarding_completed_at, tutorial_directive_id
   FROM profiles
   WHERE id = '<user_id>';
   ```
5. Score the tutorial task and verify cascade fires
6. Confirm pulse animation stops after first score
7. Verify free pull modal appears after scoring
8. Reload the app and confirm onboarding doesn't re-trigger
