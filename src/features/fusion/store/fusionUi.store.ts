import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface FusionUiState {
  selectedIngredientIds: string[]
  setSelectedIngredientIds: (ids: string[]) => void
  reset: () => void
}

const initial: Pick<FusionUiState, 'selectedIngredientIds'> = {
  selectedIngredientIds: [],
}

export const useFusionUiStore = create<FusionUiState>()(
  devtools(
    (set) => ({
      ...initial,
      setSelectedIngredientIds: (ids) =>
        set({ selectedIngredientIds: ids }, false, 'setSelectedIngredientIds'),
      reset: () => set(initial, false, 'reset'),
    }),
    { name: 'FusionUiStore' },
  ),
)
