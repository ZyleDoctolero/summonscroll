import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Guild } from '@/types'
import { guildCardVariants } from '../animations/guild.variants'

export interface GuildCardProps {
  guild: Guild
  onJoin?: (guildId: string) => void
  isJoining?: boolean
  canJoin?: boolean
  className?: string
}

export function GuildCard({ guild, onJoin, isJoining, canJoin = true, className }: GuildCardProps) {
  return (
    <motion.div
      variants={guildCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'bg-bg-surface border border-border rounded-lg p-4 flex items-center justify-between gap-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-cinzel font-semibold text-14 text-text-primary truncate">
          {guild.name}
        </h3>
        <p className="text-12 text-text-secondary truncate mt-0.5">
          {guild.description || 'No description'}
        </p>
        <p className="text-11 text-text-tertiary mt-1">
          👥 {guild.memberCount} members
        </p>
      </div>

      {onJoin && (
        <button
          onClick={() => onJoin(guild.id)}
          disabled={isJoining || !canJoin}
          aria-label={`Join ${guild.name}`}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-13 font-medium transition-colors',
            'bg-gold text-bg-deep hover:bg-gold-bright active:scale-[0.97]',
            'focus:outline-none focus:ring-2 focus:ring-gold/60',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isJoining ? 'Joining…' : 'Join'}
        </button>
      )}
    </motion.div>
  )
}
