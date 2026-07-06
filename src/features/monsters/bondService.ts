import { useQueryClient } from '@tanstack/react-query'

/**
 * Returns a helper that invalidates monster and user queries after a habit
 * completion so the Island and Compendium reflect updated bond state.
 *
 * Usage:
 *   const invalidateBond = useBondInvalidation()
 *   // after habit complete mutation succeeds:
 *   invalidateBond()
 */
export function useBondInvalidation() {
  const queryClient = useQueryClient()

  return function invalidateBond() {
    // Invalidate all user-monster queries (Island, Compendium, team slots)
    void queryClient.invalidateQueries({ queryKey: ['user-monsters'] })
    // Invalidate user data (currencies, XP, level)
    void queryClient.invalidateQueries({ queryKey: ['user'] })
    // Invalidate habits list (streak counts updated)
    void queryClient.invalidateQueries({ queryKey: ['habits'] })
  }
}
