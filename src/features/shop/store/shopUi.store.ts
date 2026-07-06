import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type ShopCategoryTab = 'daily' | 'featured' | 'packs'

interface ShopUiState {
  activeCategoryTab: ShopCategoryTab
  setActiveCategoryTab: (tab: ShopCategoryTab) => void
  /** Reserved for future cart / purchase modal flows */
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
  reset: () => void
}

const initial: Pick<ShopUiState, 'activeCategoryTab' | 'selectedItemId'> = {
  activeCategoryTab: 'daily',
  selectedItemId: null,
}

export const useShopUiStore = create<ShopUiState>()(
  devtools(
    (set) => ({
      ...initial,
      setActiveCategoryTab: (tab) =>
        set({ activeCategoryTab: tab }, false, 'setActiveCategoryTab'),
      setSelectedItemId: (id) => set({ selectedItemId: id }, false, 'setSelectedItemId'),
      reset: () => set(initial, false, 'reset'),
    }),
    { name: 'ShopUiStore' },
  ),
)
