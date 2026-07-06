import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type GuildViewTab = 'mine' | 'browse' | 'create' | 'monuments' | 'heroic_lineage'

interface GuildUiState {
  activeTab: GuildViewTab
  setActiveTab: (tab: GuildViewTab) => void
  reset: () => void
}

const initial: Pick<GuildUiState, 'activeTab'> = {
  activeTab: 'mine',
}

export const useGuildUiStore = create<GuildUiState>()(
  devtools(
    (set) => ({
      ...initial,
      setActiveTab: (tab) => set({ activeTab: tab }, false, 'setActiveTab'),
      reset: () => set(initial, false, 'reset'),
    }),
    { name: 'GuildUiStore' },
  ),
)
