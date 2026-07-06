import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type HabitViewTab = 'habits' | 'dailies' | 'todos'

interface HabitUiState {
  directivesTab: HabitViewTab
  setDirectivesTab: (tab: HabitViewTab) => void
  reset: () => void
}

const initial: Pick<HabitUiState, 'directivesTab'> = {
  directivesTab: 'habits',
}

export const useHabitUiStore = create<HabitUiState>()(
  devtools(
    (set) => ({
      ...initial,
      setDirectivesTab: (tab) => set({ directivesTab: tab }, false, 'setDirectivesTab'),
      reset: () => set(initial, false, 'reset'),
    }),
    { name: 'HabitUiStore' },
  ),
)
