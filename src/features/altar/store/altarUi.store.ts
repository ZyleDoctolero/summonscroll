import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BannerType, PullResult } from '@/types'

interface AltarUiState {
  bannerTab: BannerType
  setBannerTab: (tab: BannerType) => void
  selectedBannerId: string | null
  isRevealModalOpen: boolean
  revealResults: PullResult[] | null
  setSelectedBannerId: (bannerId: string | null) => void
  openRevealModal: (results: PullResult[]) => void
  closeRevealModal: () => void
  reset: () => void
}

const initialState: Pick<
  AltarUiState,
  'bannerTab' | 'selectedBannerId' | 'isRevealModalOpen' | 'revealResults'
> = {
  bannerTab: 'standard',
  selectedBannerId: null,
  isRevealModalOpen: false,
  revealResults: null,
}

export const useAltarUiStore = create<AltarUiState>()(
  devtools(
    (set) => ({
      ...initialState,
      setBannerTab: (tab) =>
        set({ bannerTab: tab, selectedBannerId: null }, false, 'setBannerTab'),
      setSelectedBannerId: (bannerId) =>
        set({ selectedBannerId: bannerId }, false, 'setSelectedBannerId'),
      openRevealModal: (results) =>
        set(
          { isRevealModalOpen: true, revealResults: results },
          false,
          'openRevealModal',
        ),
      closeRevealModal: () =>
        set(
          { isRevealModalOpen: false, revealResults: null },
          false,
          'closeRevealModal',
        ),
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'AltarUiStore' },
  ),
)

export const useSelectedBannerId = () =>
  useAltarUiStore((state) => state.selectedBannerId)

export const useRevealModalState = () =>
  useAltarUiStore((state) => ({
    isRevealModalOpen: state.isRevealModalOpen,
    revealResults: state.revealResults,
  }))
