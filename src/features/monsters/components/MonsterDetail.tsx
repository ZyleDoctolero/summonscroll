import { useQuery } from '@tanstack/react-query'
import { monstersApi } from '@/features/monsters/api/monsters.api'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { ElementIcon } from '@/components/ui/ElementIcon'
import { LazyImage } from '@/components/ui/LazyImage'
import { BondBar } from './BondBar'
import { SkillList } from './SkillList'
import { AwakeningStars } from './AwakeningStars'
import { SkinSelector } from './SkinSelector'
import { cn } from '@/lib/utils'

interface MonsterDetailSheetProps {
  userMonsterId: string
  onClose: () => void
}

export function MonsterDetailSheet({ userMonsterId, onClose }: MonsterDetailSheetProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-monster', userMonsterId],
    queryFn: () => monstersApi.getUserMonster(userMonsterId),
  })

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Monster details"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-lg bg-bg-elevated rounded-t-2xl sm:rounded-2xl',
          'max-h-[90dvh] overflow-y-auto',
          'border border-border',
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-surface text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          aria-label="Close monster details"
        >
          ✕
        </button>

        {isLoading && (
          <div className="p-6 space-y-4">
            <div className="skeleton h-48 w-full rounded-lg" />
            <div className="skeleton h-6 w-48 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        )}

        {isError && (
          <div className="p-6 text-center text-danger text-14">
            Failed to load monster details.
          </div>
        )}

        {data && (() => {
          const um = data.data
          const m = um.monster

          return (
            <div className="p-4 space-y-4">
              {/* Art + name header */}
              <div className="flex gap-4">
                <div
                  className="w-32 h-32 rounded-lg overflow-hidden bg-bg-surface flex-shrink-0"
                  style={{
                    boxShadow: m.rarity !== 'common' ? `var(--glow-${m.rarity})` : undefined,
                  }}
                >
                  {m.artUrl ? (
                    <LazyImage src={m.artUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-48 opacity-30">
                      👾
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="font-cinzel font-bold text-20 text-text-primary leading-tight">
                    {m.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <RarityBadge rarity={m.rarity} size="sm" />
                    <ElementIcon element={m.element} showLabel size="sm" />
                  </div>
                  <AwakeningStars stage={um.awakeningStage} size="sm" className="mt-2" />
                  <p className="text-12 text-text-tertiary mt-1">
                    {m.realm?.name ?? 'Unknown Realm'} · {m.origin}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div
                className="grid grid-cols-4 gap-2 bg-bg-surface rounded-lg p-3 border border-border"
              >
                {[
                  { label: 'HP',  value: m.baseHp },
                  { label: 'ATK', value: m.baseAtk },
                  { label: 'DEF', value: m.baseDef },
                  { label: 'SPD', value: m.baseSpd },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-11 text-text-tertiary uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="font-mono font-bold text-14 text-text-primary">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Level */}
              <div className="flex items-center justify-between text-13">
                <span className="text-text-secondary">Level</span>
                <span className="font-mono font-bold text-text-primary">{um.level}</span>
              </div>

              {/* Bond bar */}
              <BondBar bondPercent={um.bondPercent} rarity={m.rarity} />

              {/* Lore */}
              {m.lore && (
                <div
                  className="bg-bg-surface rounded-lg p-3 border border-border"
                >
                  <h3 className="font-cinzel font-semibold text-12 text-text-tertiary uppercase tracking-wider mb-1.5">
                    Lore
                  </h3>
                  <p className="text-13 text-text-secondary leading-relaxed">{m.lore}</p>
                </div>
              )}

              {/* EX Realm Skill */}
              {m.isEx && m.realmSkill && (
                <div
                  className="bg-rarity-ex/5 rounded-lg p-3 border border-rarity-ex/20"
                >
                  <h3 className="font-cinzel font-semibold text-12 text-rarity-ex uppercase tracking-wider mb-1">
                    Realm Skill
                  </h3>
                  <p className="text-13 text-text-primary">{m.realmSkill}</p>
                </div>
              )}

              {/* Skills */}
              <SkillList
                skills={m.skills}
                bondPercent={um.bondPercent}
                isEx={m.isEx}
              />

              {/* Skins */}
              <SkinSelector
                userMonsterId={um.id}
                equippedSkinId={um.equippedSkinId}
                monsterId={m.id}
              />
            </div>
          )
        })()}
      </div>
    </div>
  )
}
