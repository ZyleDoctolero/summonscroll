import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { PullResult } from '@/types'

interface Toast {
  id: string
  type: 'success' | 'error' | 'achievement' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UiState {
  // Summon reveal
  pendingReveal: PullResult[] | null
  isRevealOpen: boolean

  // Level up overlay
  isLevelUpOpen: boolean
  newLevel: number | null

  // Toast queue
  toasts: Toast[]

  // Currency float animations
  floatingCurrencies: Array<{
    id: string
    amount: number
    type: 'crystals' | 'shards' | 'seals' | 'xp'
    x: number
    y: number
  }>

  // Drawer state
  isDrawerOpen: boolean

  // Actions
  openReveal: (results: PullResult[]) => void
  closeReveal: () => void
  openLevelUp: (level: number) => void
  closeLevelUp: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  addFloatingCurrency: (
    amount: number,
    type: UiState['floatingCurrencies'][number]['type'],
    x: number,
    y: number,
  ) => void
  removeFloatingCurrency: (id: string) => void
  toggleDrawer: () => void
  closeDrawer: () => void
}

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      pendingReveal: null,
      isRevealOpen: false,
      isLevelUpOpen: false,
      newLevel: null,
      toasts: [],
      floatingCurrencies: [],
      isDrawerOpen: false,

      openReveal: (results) =>
        set({ pendingReveal: results, isRevealOpen: true }, false, 'openReveal'),

      closeReveal: () =>
        set({ isRevealOpen: false, pendingReveal: null }, false, 'closeReveal'),

      openLevelUp: (level) =>
        set({ isLevelUpOpen: true, newLevel: level }, false, 'openLevelUp'),

      closeLevelUp: () =>
        set({ isLevelUpOpen: false, newLevel: null }, false, 'closeLevelUp'),

      addToast: (toast) =>
        set(
          (state) => ({
            toasts: [
              ...state.toasts,
              { ...toast, id: crypto.randomUUID() },
            ],
          }),
          false,
          'addToast',
        ),

      removeToast: (id) =>
        set(
          (state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }),
          false,
          'removeToast',
        ),

      addFloatingCurrency: (amount, type, x, y) =>
        set(
          (state) => ({
            floatingCurrencies: [
              ...state.floatingCurrencies,
              { id: crypto.randomUUID(), amount, type, x, y },
            ],
          }),
          false,
          'addFloatingCurrency',
        ),

      removeFloatingCurrency: (id) =>
        set(
          (state) => ({
            floatingCurrencies: state.floatingCurrencies.filter(
              (f) => f.id !== id,
            ),
          }),
          false,
          'removeFloatingCurrency',
        ),

      toggleDrawer: () =>
        set(
          (state) => ({ isDrawerOpen: !state.isDrawerOpen }),
          false,
          'toggleDrawer',
        ),

      closeDrawer: () =>
        set({ isDrawerOpen: false }, false, 'closeDrawer'),
    }),
    { name: 'UiStore' },
  ),
)
