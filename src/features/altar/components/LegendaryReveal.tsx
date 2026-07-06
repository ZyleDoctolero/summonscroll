import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { ElementIcon } from '@/components/ui/ElementIcon'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSafeVariants } from '@/lib/animations'
import { summonRevealVariants, rarityGlowVariants } from '../animations/summon.variants'
import { MonsterArtDisplay } from './MonsterArtDisplay'
import { TapToContinue } from './TapToContinue'
import type { RevealProps } from './revealTypes'

type RevealPhase =
  | 'overlay'
  | 'portal'
  | 'monster'
  | 'particles'
  | 'name'
  | 'done'

export function LegendaryReveal({ result, skip, onDone }: RevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('overlay')
  const reducedMotion = useReducedMotion()
  const { monster } = result
  const safeRevealVariants = useSafeVariants(summonRevealVariants)
  const safeGlowVariants = useSafeVariants(rarityGlowVariants)

  // Pre-generate stable particle positions
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${(i * 5) % 100}%`,
      top: `${(i * 7.3) % 100}%`,
      delay: (i % 6) * 0.1,
      opacity: 0.2 + (i % 5) * 0.12,
    })),
  [])

  useEffect(() => {
    if (skip || reducedMotion) {
      const t = setTimeout(() => setPhase('done'), 0)
      return () => clearTimeout(t)
    }

    const timings: Array<[RevealPhase, number]> = [
      ['overlay',   0],
      ['portal',    300],
      ['monster',   1500],
      ['particles', 2000],
      ['name',      2600],
      ['done',      2900],
    ]

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [skip, reducedMotion])

  return (
    <motion.div
      className="relative w-full h-full flex flex-col items-center justify-center"
      style={{ cursor: phase === 'done' ? 'pointer' : 'default' }}
      onClick={phase === 'done' ? onDone : undefined}
      initial={{ background: 'rgba(0,0,0,0.95)' }}
      animate={{
        background: phase === 'overlay' || phase === 'portal'
          ? 'rgba(0,0,0,0.95)'
          : 'rgba(0,0,0,0.85)'
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Gold portal crack effect */}
      <AnimatePresence>
        {(phase === 'portal' || phase === 'monster') && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <img
              src="/images/summonscroll/legendary_portal.jpg"
              alt="Legendary Portal"
              className="w-[800px] h-[800px] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monster */}
      <AnimatePresence>
        {(phase === 'monster' || phase === 'particles' || phase === 'name' || phase === 'done') && (
          <motion.div
            className="relative z-10"
            variants={safeRevealVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={safeGlowVariants}
              initial="hidden"
              animate="visible"
            >
              <MonsterArtDisplay monster={monster} size="xl" glow />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gold particle cascade */}
      <AnimatePresence>
        {(phase === 'particles' || phase === 'name' || phase === 'done') && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-1 h-1 rounded-full bg-gold-bright"
                style={{ left: p.left, top: p.top }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, p.opacity, 0], y: -48 }}
                transition={{
                  duration: 1,
                  delay: p.delay,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Name */}
      <AnimatePresence>
        {(phase === 'name' || phase === 'done') && (
          <motion.div
            className="mt-6 text-center z-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2
              className="font-cinzel font-bold text-32 mb-2"
              style={{ color: 'var(--rarity-legendary)', textShadow: 'var(--glow-legendary)' }}
            >
              {monster.name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <RarityBadge rarity="legendary" size="lg" />
              <ElementIcon element={monster.element} showLabel size="lg" />
            </div>
            {result.isNew && (
              <p className="text-success text-14 mt-2 font-medium">New!</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'done' && <TapToContinue />}
    </motion.div>
  )
}
