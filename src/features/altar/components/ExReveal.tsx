import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSafeVariants } from '@/lib/animations'
import { summonRevealVariants } from '../animations/summon.variants'
import { MonsterArtDisplay } from './MonsterArtDisplay'
import { TapToContinue } from './TapToContinue'
import type { RevealProps } from './revealTypes'

type ExPhase =
  | 'blackout'
  | 'point'
  | 'nova'
  | 'recede'
  | 'reveal'
  | 'badge'
  | 'skill'
  | 'done'

export function ExReveal({ result, skip, onDone }: RevealProps) {
  const [phase, setPhase] = useState<ExPhase>('blackout')
  const reducedMotion = useReducedMotion()
  const { monster } = result
  const safeRevealVariants = useSafeVariants(summonRevealVariants)

  useEffect(() => {
    if (skip || reducedMotion) {
      const t = setTimeout(() => setPhase('done'), 0)
      return () => clearTimeout(t)
    }

    const timings: Array<[ExPhase, number]> = [
      ['blackout', 0],
      ['point',    400],
      ['nova',     600],
      ['recede',   800],
      ['reveal',   1400],
      ['badge',    1800],
      ['skill',    2100],
      ['done',     2500],
    ]

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [skip, reducedMotion])

  return (
    <motion.div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      onClick={phase === 'done' ? onDone : undefined}
      initial={{ background: 'rgba(0,0,0,1)' }}
      animate={{ background: phase === 'nova' ? '#FFFFFF' : 'rgba(0,0,0,1)' }}
      transition={{ duration: 0.2 }}
    >
      {/* White nova point */}
      <AnimatePresence>
        {phase === 'point' && (
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-white"
            style={{ boxShadow: '0 0 20px 10px rgba(255,255,255,0.8)' }}
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Nova expand */}
      <AnimatePresence>
        {phase === 'nova' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <img
              src="/images/summonscroll/ex_portal.jpg"
              alt="EX Portal Nova"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monster silhouette -> reveal */}
      <AnimatePresence>
        {(phase === 'recede' || phase === 'reveal' || phase === 'badge' || phase === 'skill' || phase === 'done') && (
          <motion.div
            className="relative z-10"
            variants={safeRevealVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              initial={{ filter: 'brightness(0)' }}
              animate={{ filter: phase === 'recede' ? 'brightness(0)' : 'brightness(1)' }}
              transition={{ duration: 0.6 }}
            >
              <MonsterArtDisplay monster={monster} size="xl" glow exGlow />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EX badge */}
      <AnimatePresence>
        {(phase === 'badge' || phase === 'skill' || phase === 'done') && (
          <motion.div
            className="mt-6 text-center z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2
              className="font-cinzel font-bold text-48 mb-2"
              style={{
                color: 'var(--rarity-ex)',
                textShadow: 'var(--glow-ex)',
              }}
            >
              {monster.name}
            </h2>
            <RarityBadge rarity="ex" size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realm Skill */}
      <AnimatePresence>
        {(phase === 'skill' || phase === 'done') && monster.realmSkill && (
          <motion.div
            className="mt-3 z-10 bg-bg-elevated/80 rounded-lg px-4 py-2 border border-white/20 text-center max-w-xs"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-12 text-text-secondary uppercase tracking-wider mb-1">
              Realm Skill
            </p>
            <p className="font-cinzel font-semibold text-14 text-rarity-ex">
              {monster.realmSkill}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'done' && <TapToContinue />}
    </motion.div>
  )
}
