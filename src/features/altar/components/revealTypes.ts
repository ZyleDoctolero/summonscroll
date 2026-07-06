import type { PullResult } from '@/types'

/** Shared props for all rarity-specific reveal components */
export interface RevealProps {
  result: PullResult
  skip: boolean
  onDone: () => void
}
