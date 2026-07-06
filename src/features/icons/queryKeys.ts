export const iconKeys = {
  all: ['icons'] as const,
  list: (type?: string) => [...iconKeys.all, 'list', { type }] as const,
}
