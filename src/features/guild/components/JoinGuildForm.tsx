import { cn } from '@/lib/utils'
import { useJoinGuild } from '../hooks/useGuild'

export interface JoinGuildFormProps {
  guildId: string
  guildName: string
  onSuccess?: () => void
  className?: string
}

export function JoinGuildForm({ guildId, guildName, onSuccess, className }: JoinGuildFormProps) {
  const { mutate, isPending } = useJoinGuild()

  function handleJoin() {
    mutate(guildId, { onSuccess })
  }

  return (
    <div className={cn('flex flex-col items-center gap-4 py-4', className)}>
      <p className="text-14 text-text-secondary text-center">
        You are about to join{' '}
        <span className="font-cinzel font-semibold text-text-primary">{guildName}</span>.
        Ready to commit?
      </p>

      <button
        onClick={handleJoin}
        disabled={isPending}
        aria-label={`Join ${guildName}`}
        className={cn(
          'px-6 py-2.5 rounded-lg font-medium text-14 transition-all',
          'bg-gold text-bg-deep hover:bg-gold-bright active:scale-[0.97]',
          'focus:outline-none focus:ring-2 focus:ring-gold/60',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isPending ? 'Joining…' : `Join ${guildName}`}
      </button>
    </div>
  )
}
