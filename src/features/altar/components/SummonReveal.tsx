import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { StandardReveal } from './StandardReveal'
import { LegendaryReveal } from './LegendaryReveal'
import { MythicReveal } from './MythicReveal'
import { ExReveal } from './ExReveal'
import { PullResultGrid } from './PullResultGrid'
import type { PullResult } from '@/types'

interface SummonRevealProps {
  results: PullResult[]
  onClose: () => void
}

const REVEAL_BY_RARITY = {
  ex: ExReveal,
  mythic: MythicReveal,
  legendary: LegendaryReveal,
} as const

export function SummonReveal({ results, onClose }: SummonRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [skipAnim, setSkipAnim] = useState(false)

  const currentResult = results[currentIndex]
  const isMulti = results.length > 1

  const handleNext = useCallback(() => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex((i) => i + 1)
      setSkipAnim(false)
    } else {
      setShowAll(true)
    }
  }, [currentIndex, results.length])

  // Show skip button after 500ms
  const [showSkip, setShowSkip] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setShowSkip(false), 0)
    const t2 = setTimeout(() => setShowSkip(true), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [currentIndex])

  if (showAll) {
    return <PullResultGrid results={results} onClose={onClose} />
  }

  if (!currentResult) return null

  const { monster } = currentResult
  const RevealComponent =
    REVEAL_BY_RARITY[monster.rarity as keyof typeof REVEAL_BY_RARITY] ?? StandardReveal

  return (
    <div
      className="fixed inset-0 z-reveal flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Summoning ${monster.name}`}
    >
      <RevealComponent
        result={currentResult}
        skip={skipAnim}
        onDone={isMulti ? handleNext : onClose}
      />

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={() => setSkipAnim(true)}
          className="absolute bottom-8 right-8 text-13 text-text-secondary hover:text-text-primary transition-colors bg-bg-overlay rounded-pill px-3 py-1.5"
          aria-label="Skip animation"
        >
          Skip
        </button>
      )}

      {/* Progress indicator for multi-pull */}
      {isMulti && !showAll && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
          {results.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                i === currentIndex ? 'bg-gold' : 'bg-bg-elevated',
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  )
}
