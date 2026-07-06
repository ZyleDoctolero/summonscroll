import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BattleMode } from '@/types'

export interface ActiveBattleSelection {
  mode: BattleMode
  floor: number
}

interface BattleUiState {
  activeBattle: ActiveBattleSelection | null
  setActiveBattle: (battle: ActiveBattleSelection | null) => void
  reset: () => void
}

const initial: Pick<BattleUiState, 'activeBattle'> = {
  activeBattle: null,
}

export const useBattleUiStore = create<BattleUiState>()(
  devtools(
    (set) => ({
      ...initial,
      setActiveBattle: (battle) =>
        set({ activeBattle: battle }, false, 'setActiveBattle'),
      reset: () => set(initial, false, 'reset'),
    }),
    { name: 'BattleUiStore' },
  ),
)
