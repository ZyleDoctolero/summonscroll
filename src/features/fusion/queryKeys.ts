export const fusionKeys = {
  all: ['fusion'] as const,
  preview: (ids: string[]) => [...fusionKeys.all, 'preview', ids] as const,
  history: () => [...fusionKeys.all, 'history'] as const,
}
