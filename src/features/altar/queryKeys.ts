export const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (type?: string) => [...bannerKeys.lists(), { type }] as const,
  detail: (id: string) => [...bannerKeys.all, id] as const,
}
