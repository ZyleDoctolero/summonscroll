import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { ElementIcon } from '@/components/ui/ElementIcon'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { useSafeVariants } from '@/lib/animations'
import { summonRevealVariants } from '../animations/summon.variants'
import { MonsterArtDisplay } from './MonsterArtDisplay'
import { TapToContinue } from './TapToContinue'
import type { RevealProps } from './revealTypes'

type RevealPhase =
  | 'idle'
  | 'overlay'
  | 'portal'
  | 'monster'
  | 'particles'
  | 'name'
  | 'done'

export function StandardReveal({ result, skip, onDone }: RevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('overlay')
  const reducedMotion = useReducedMotion()
  const { monster } = result
  const safeRevealVariants = useSafeVariants(summonRevealVariants)

  useEffect(() => {
    if (skip || reducedMotion) {
      const t = setTimeout(() => setPhase('done'), 0)
      return () => clearTimeout(t)
    }

    const timings: Array<[RevealPhase, number]> = [
      ['overlay',   0],
      ['portal',    150],
      ['monster',   450],
      ['particles', 850],
      ['name',      1100],
      ['done',      1300],
    ]

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [skip, reducedMotion])

  return (
    <motion.div
      className={cn(
        'relative w-full h-full flex flex-col items-center justify-center',
        phase !== 'idle' && 'bg-bg-overlay',
      )}
      onClick={phase === 'done' ? onDone : undefined}
      style={{ cursor: phase === 'done' ? 'pointer' : 'default' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Portal */}
      <AnimatePresence>
        {(phase === 'portal' || phase === 'monster' || phase === 'particles' || phase === 'name' || phase === 'done') && (
          <motion.img
            src="/images/summonscroll/common_portal.jpg"
            alt="Portal"
            className="absolute w-64 h-64 object-contain"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: phase === 'portal' ? 1 : 0,
              scale: 1
            }}
            transition={{ duration: 0.3 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Monster art */}
      <AnimatePresence>
        {(phase === 'monster' || phase === 'particles' || phase === 'name' || phase === 'done') && (
          <motion.div
            className="relative z-10"
            variants={safeRevealVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4 }}
          >
            <MonsterArtDisplay monster={monster} size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name + badge */}
      <AnimatePresence>
        {(phase === 'name' || phase === 'done') && (
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className="font-cinzel font-bold text-24 text-text-primary mb-2">
              {monster.name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <RarityBadge rarity={monster.rarity} size="md" />
              <ElementIcon element={monster.element} showLabel />
            </div>
            {result.isNew && (
              <p className="text-success text-13 mt-2 font-medium">New!</p>
            )}
            {result.transcendenceStoneGranted && (
              <p className="text-gold text-13 mt-2 font-medium">
                Transcendence Stone granted
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'done' && <TapToContinue />}
    </motion.div>
  )
}
