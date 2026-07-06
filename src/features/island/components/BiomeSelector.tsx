import { cn } from '@/lib/utils'

const BIOMES = [
  { id: 'verdant',   name: 'Verdant Vale',    icon: '🌿', unlockLevel: 1 },
  { id: 'volcanic',  name: 'Volcanic Crater', icon: '🌋', unlockLevel: 10 },
  { id: 'arctic',    name: 'Arctic Tundra',   icon: '❄️', unlockLevel: 20 },
  { id: 'void',      name: 'Void Rift',       icon: '🌌', unlockLevel: 30 },
  { id: 'celestial', name: 'Celestial Spire', icon: '⭐', unlockLevel: 50 },
]

interface BiomeSelectorProps {
  currentLevel: number
  activeBiome: string
  onSelect: (biomeId: string) => void
}

export function BiomeSelector({ currentLevel, activeBiome, onSelect }: BiomeSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider">
        Island Biome
      </h3>
      <div className="flex gap-2 flex-wrap">
        {BIOMES.map((biome) => {
          const isUnlocked = currentLevel >= biome.unlockLevel
          const isActive = activeBiome === biome.id

          return (
            <button
              key={biome.id}
              onClick={() => isUnlocked && onSelect(biome.id)}
              disabled={!isUnlocked}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-13 font-medium transition-all border',
                isActive
                  ? 'bg-gold/20 border-gold text-gold'
                  : isUnlocked
                  ? 'bg-bg-elevated border-border text-text-secondary hover:border-gold/40 hover:text-text-primary'
                  : 'bg-bg-surface border-border text-text-disabled cursor-not-allowed opacity-50',
              )}
              aria-pressed={isActive}
              aria-label={
                isUnlocked
                  ? `${biome.name} biome`
                  : `${biome.name} — unlocks at level ${biome.unlockLevel}`
              }
              title={!isUnlocked ? `Unlocks at level ${biome.unlockLevel}` : undefined}
            >
              <span aria-hidden="true">{biome.icon}</span>
              {biome.name}
              {!isUnlocked && (
                <span className="text-10 text-text-disabled">🔒 {biome.unlockLevel}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
