export const shopKeys = {
  all: ['shop'] as const,
  items: (tab?: string) => [...shopKeys.all, 'items', { tab }] as const,
}
