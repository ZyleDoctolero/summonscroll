import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { monstersApi } from '@/features/monsters/api/monsters.api'
import { MonsterIslandSprite } from './IslandSprite'
import { cn } from '@/lib/utils'
import type { UserMonster } from '@/types'

const MAX_TEAM_SIZE = 5

interface TeamSlotsProps {
  onSelectMonster?: (um: UserMonster) => void
}

export function TeamSlots({ onSelectMonster }: TeamSlotsProps) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['user-monsters', { onTeam: true }],
    queryFn: () => monstersApi.getUserMonsters(),
  })

  const removeFromTeamMutation = useMutation({
    mutationFn: (userMonsterId: string) =>
      monstersApi.setTeamSlot(userMonsterId, null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-monsters'] })
    },
  })

  const teamMonsters = (data?.data ?? [])
    .filter((um) => um.isOnTeam)
    .sort((a, b) => (a.teamSlot ?? 0) - (b.teamSlot ?? 0))

  const emptySlots = MAX_TEAM_SIZE - teamMonsters.length

  return (
    <div className="space-y-2">
      <h3 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider">
        Team ({teamMonsters.length}/{MAX_TEAM_SIZE})
      </h3>

      <div className="flex gap-3 flex-wrap">
        {/* Filled slots */}
        {teamMonsters.map((um) => (
          <div key={um.id} className="relative">
            <MonsterIslandSprite
              userMonster={um}
              onClick={() => onSelectMonster?.(um)}
            />
            <button
              onClick={() => removeFromTeamMutation.mutate(um.id)}
              className="absolute -top-1 -left-1 w-4 h-4 bg-danger rounded-full text-white text-9 flex items-center justify-center hover:bg-danger/80 transition-colors"
              aria-label={`Remove ${um.monster.name} from team`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={cn(
              'w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center',
              'border-border text-text-disabled text-20',
            )}
            aria-label="Empty team slot"
          >
            +
          </div>
        ))}
      </div>

      {teamMonsters.length === 0 && (
        <p className="text-13 text-text-tertiary">
          Assign monsters from your Compendium to build your team.
        </p>
      )}
    </div>
  )
}
