import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGuildMembers } from '../hooks/useGuild'
import { memberJoinVariants } from '../animations/guild.variants'

export interface GuildMembersProps {
  guildId: string
  className?: string
}

export function GuildMembers({ guildId, className }: GuildMembersProps) {
  const { data: members, isLoading, isError } = useGuildMembers(guildId)

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)} aria-busy="true" aria-label="Loading members">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-bg-surface rounded-lg border border-border">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className={cn('text-13 text-danger text-center py-4', className)}>
        Failed to load members.
      </p>
    )
  }

  if (!members?.length) {
    return (
      <p className={cn('text-13 text-text-tertiary text-center py-4', className)}>
        No members yet.
      </p>
    )
  }

  return (
    <ul className={cn('space-y-2', className)} role="list" aria-label="Guild members">
      {members.map((member) => (
        <motion.li
          key={member.id}
          variants={memberJoinVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between gap-3 p-3 bg-bg-surface rounded-lg border border-border"
        >
          <div className="min-w-0">
            <p className="text-13 font-medium text-text-primary truncate">{member.username}</p>
            <p className="text-11 text-text-tertiary">Lv. {member.level}</p>
          </div>
          <span className="text-12 text-gold font-mono flex-shrink-0">
            +{member.contribution.toLocaleString()} pts
          </span>
        </motion.li>
      ))}
    </ul>
  )
}
