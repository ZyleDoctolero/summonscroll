export const guildKeys = {
  all: ['guild'] as const,
  mine: () => [...guildKeys.all, 'mine'] as const,
  browse: () => [...guildKeys.all, 'browse'] as const,
  detail: (id: string) => [...guildKeys.all, id] as const,
  members: (id: string) => [...guildKeys.all, id, 'members'] as const,
}
