import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface MonsterUiState {
  selectedMonsterId: string | null
  setSelectedMonsterId: (id: string | null) => void
  reset: () => void
}

const initial: Pick<MonsterUiState, 'selectedMonsterId'> = {
  selectedMonsterId: null,
}

export const useMonsterUiStore = create<MonsterUiState>()(
  devtools(
    (set) => ({
      ...initial,
      setSelectedMonsterId: (id) => set({ selectedMonsterId: id }, false, 'setSelectedMonsterId'),
      reset: () => set(initial, false, 'reset'),
    }),
    { name: 'MonsterUiStore' },
  ),
)
