import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, AuthTokens } from '@/types'

interface UserState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  // Actions
  setUser: (user: User) => void
  setTokens: (tokens: AuthTokens) => void
  updateCurrencies: (delta: {
    spiritCrystals?: number
    voidShards?: number
    pactSeals?: number
  }) => void
  updateXp: (xpGained: number) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,

        setUser: (user) =>
          set({ user, isAuthenticated: true }, false, 'setUser'),

        setTokens: (tokens) => {
          // Persist refresh token in sessionStorage so the 401 interceptor can use it.
          // It is intentionally NOT in the Zustand persist store to avoid XSS exposure
          // via localStorage being read by arbitrary scripts.
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('summonscroll-refresh', tokens.refreshToken)
          }
          set(
            { accessToken: tokens.accessToken, isAuthenticated: true },
            false,
            'setTokens',
          )
        },

        updateCurrencies: (delta) =>
          set(
            (state) => {
              if (!state.user) return state
              return {
                user: {
                  ...state.user,
                  spiritCrystals:
                    state.user.spiritCrystals + (delta.spiritCrystals ?? 0),
                  voidShards:
                    state.user.voidShards + (delta.voidShards ?? 0),
                  pactSeals:
                    state.user.pactSeals + (delta.pactSeals ?? 0),
                },
              }
            },
            false,
            'updateCurrencies',
          ),

        updateXp: (xpGained) =>
          set(
            (state) => {
              if (!state.user) return state
              const newXp = state.user.xp + xpGained
              const leveledUp = newXp >= state.user.xpToNextLevel
              const newLevel = leveledUp ? state.user.level + 1 : state.user.level

              // Trigger level-up overlay via uiStore (lazy import to avoid circular dep)
              if (leveledUp) {
                // Use dynamic import to avoid circular dependency between stores
                import('@/stores/uiStore').then(({ useUiStore }) => {
                  useUiStore.getState().openLevelUp(newLevel)
                }).catch(() => { /* non-critical */ })
              }

              return {
                user: {
                  ...state.user,
                  xp: leveledUp ? newXp - state.user.xpToNextLevel : newXp,
                  level: newLevel,
                  xpToNextLevel: leveledUp
                    ? Math.floor(state.user.xpToNextLevel * 1.15)
                    : state.user.xpToNextLevel,
                },
              }
            },
            false,
            'updateXp',
          ),

        logout: () => {
          // Clear refresh token from sessionStorage
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('summonscroll-refresh')
          }
          set(
            { user: null, accessToken: null, isAuthenticated: false },
            false,
            'logout',
          )
        },
      }),
      {
        name: 'summonscroll-user',
        // Only persist the access token and user — not derived state
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'UserStore' },
  ),
)
