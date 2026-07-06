import { cn } from '@/lib/utils'
import { ElementIcon } from '@/components/ui/ElementIcon'
import type { Skill } from '@/types'

interface SkillListProps {
  skills: Skill[]
  bondPercent: number
  isEx?: boolean
}

export function SkillList({ skills, bondPercent, isEx = false }: SkillListProps) {
  const sorted = [...skills].sort((a, b) => a.slot - b.slot)

  return (
    <div className="space-y-2">
      <h3 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider">
        Skills
      </h3>
      <ul className="space-y-2" aria-label="Monster skills">
        {sorted.map((skill) => {
          const isUnlocked = bondPercent >= skill.unlockBondPercent
          const isRealmSkill = skill.slot === 4

          return (
            <li
              key={skill.id}
              className={cn(
                'rounded-lg p-3 border transition-all',
                isUnlocked
                  ? 'bg-bg-elevated border-border'
                  : 'bg-bg-surface border-border opacity-50',
                isRealmSkill && isEx && 'border-rarity-ex/40',
              )}
              aria-label={
                isUnlocked
                  ? `Skill ${skill.slot}: ${skill.name}`
                  : `Skill ${skill.slot} locked — requires ${skill.unlockBondPercent}% bond`
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Slot indicator */}
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-10 font-bold flex-shrink-0',
                      isRealmSkill
                        ? 'bg-rarity-ex/20 text-rarity-ex'
                        : 'bg-bg-deep text-text-tertiary',
                    )}
                    aria-hidden="true"
                  >
                    {skill.slot}
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'font-cinzel font-semibold text-13',
                          isUnlocked ? 'text-text-primary' : 'text-text-disabled',
                          isRealmSkill && isEx && 'text-rarity-ex',
                        )}
                      >
                        {isUnlocked ? skill.name : '???'}
                      </span>
                      {isRealmSkill && (
                        <span className="text-10 text-rarity-ex bg-rarity-ex/10 rounded-pill px-1.5 py-0.5 uppercase tracking-wider">
                          Realm
                        </span>
                      )}
                      {skill.element && isUnlocked && (
                        <ElementIcon element={skill.element} size="sm" />
                      )}
                    </div>

                    {isUnlocked ? (
                      <p className="text-12 text-text-secondary mt-0.5">
                        {skill.description}
                      </p>
                    ) : (
                      <p className="text-12 text-text-disabled mt-0.5">
                        Unlocks at {skill.unlockBondPercent}% bond
                      </p>
                    )}
                  </div>
                </div>

                {skill.cooldown > 0 && isUnlocked && (
                  <span className="text-11 font-mono text-text-tertiary flex-shrink-0">
                    CD: {skill.cooldown}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
