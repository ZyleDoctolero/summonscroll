import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { ElementIcon } from '@/components/ui/ElementIcon'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSafeVariants } from '@/lib/animations'
import { summonRevealVariants, rarityGlowVariants } from '../animations/summon.variants'
import { MonsterArtDisplay } from './MonsterArtDisplay'
import { TapToContinue } from './TapToContinue'
import type { RevealProps } from './revealTypes'

type MythicPhase = 'blackout' | 'aurora' | 'silhouette' | 'reveal' | 'name' | 'done'

export function MythicReveal({ result, skip, onDone }: RevealProps) {
  const [phase, setPhase] = useState<MythicPhase>('blackout')
  const reducedMotion = useReducedMotion()
  const { monster } = result
  const safeRevealVariants = useSafeVariants(summonRevealVariants)
  const safeGlowVariants = useSafeVariants(rarityGlowVariants)

  useEffect(() => {
    if (skip || reducedMotion) {
      const t = setTimeout(() => setPhase('done'), 0)
      return () => clearTimeout(t)
    }

    const timings = [
      ['blackout',   0],
      ['aurora',     600],
      ['silhouette', 1100],
      ['reveal',     1900],
      ['name',       2200],
      ['done',       2500],
    ] as const

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p as MythicPhase), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [skip, reducedMotion])

  return (
    <motion.div
      className="relative w-full h-full flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.98)' }}
      onClick={phase === 'done' ? onDone : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Prismatic aurora border (Mythic Portal) */}
      <AnimatePresence>
        {phase !== 'blackout' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{
              opacity: phase === 'aurora' ? 0 : 0.6,
              rotate: 360
            }}
            transition={{
              opacity: { duration: 0.5 },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
            }}
          >
            <img
              src="/images/summonscroll/mythic_portal.jpg"
              alt="Mythic Portal"
              className="w-[900px] h-[900px] object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monster (silhouette -> full) */}
      <AnimatePresence>
        {(phase === 'silhouette' || phase === 'reveal' || phase === 'name' || phase === 'done') && (
          <motion.div
            className="relative z-10"
            variants={safeRevealVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              initial={{ filter: 'brightness(0)' }}
              animate={{ filter: phase === 'silhouette' ? 'brightness(0)' : 'brightness(1)' }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                variants={safeGlowVariants}
                initial="hidden"
                animate="visible"
              >
                <MonsterArtDisplay monster={monster} size="xl" glow />
              </motion.div>
            </motion.div>
          </motion.div>
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
              style={{ color: 'var(--rarity-mythic)', textShadow: 'var(--glow-mythic)' }}
            >
              {monster.name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <RarityBadge rarity="mythic" size="lg" />
              <ElementIcon element={monster.element} showLabel size="lg" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'done' && <TapToContinue />}
    </motion.div>
  )
}
