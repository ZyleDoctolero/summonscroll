import { useEffect, useMemo } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Full-screen level-up overlay.
 * Triggered by `useUiStore.openLevelUp(level)`.
 * Auto-dismisses after 1.5s (or immediately if reduced motion is preferred).
 */
export function LevelUpOverlay() {
  const { isLevelUpOpen, newLevel, closeLevelUp } = useUiStore()
  const reducedMotion = useReducedMotion()

  // Pre-generate particle positions once per open — stable across re-renders
  const particles = useMemo(() => {
    if (reducedMotion) return []
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: `${10 + (i * 5.3125) % 80}%`,
      top: `${10 + (i * 4.375) % 80}%`,
      duration: `${0.8 + (i % 4) * 0.2}s`,
      delay: `${(i % 5) * 0.1}s`,
      opacity: 0.2 + (i % 5) * 0.15,
    }))
  }, [reducedMotion, isLevelUpOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLevelUpOpen) return
    // Auto-dismiss: 1.5s normally, 600ms for reduced motion
    const delay = reducedMotion ? 600 : 1500
    const timer = setTimeout(closeLevelUp, delay)
    return () => clearTimeout(timer)
  }, [isLevelUpOpen, reducedMotion, closeLevelUp])

  if (!isLevelUpOpen || newLevel === null) return null

  return (
    <div
      className="fixed inset-0 z-reveal flex flex-col items-center justify-center pointer-events-none"
      style={{
        background: reducedMotion
          ? 'rgba(0,0,0,0.85)'
          : 'rgba(0,0,0,0.88)',
        animation: reducedMotion ? undefined : 'levelup-fade 1.5s ease forwards',
      }}
      role="status"
      aria-live="polite"
      aria-label={`Level up! You are now level ${newLevel}`}
    >
      {/* Gold shimmer text */}
      <p
        className="font-cinzel font-bold text-center select-none"
        style={{
          fontSize: '64px',
          lineHeight: 1.1,
          color: 'var(--color-gold-bright)',
          textShadow: 'var(--glow-legendary)',
          animation: reducedMotion ? undefined : 'levelup-scale 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        LEVEL UP
      </p>

      {/* New level number */}
      <p
        className="font-cinzel font-bold mt-4 select-none"
        style={{
          fontSize: '48px',
          color: 'var(--color-gold)',
          textShadow: 'var(--glow-legendary)',
          animation: reducedMotion ? undefined : 'levelup-scale 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {newLevel}
      </p>

      {/* Particle shimmer — hidden for reduced motion */}
      {!reducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-gold-bright)',
                left: p.left,
                top: p.top,
                animation: `float-particle ${p.duration} ${p.delay} ease-out forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes levelup-fade {
          0%   { opacity: 0 }
          15%  { opacity: 1 }
          75%  { opacity: 1 }
          100% { opacity: 0 }
        }
        @keyframes levelup-scale {
          0%   { opacity: 0; transform: scale(0.6) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes float-particle {
          0%   { opacity: 0.8; transform: translateY(0) scale(1) }
          100% { opacity: 0;   transform: translateY(-60px) scale(0.5) }
        }
      `}</style>
    </div>
  )
}
