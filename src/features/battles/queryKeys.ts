export const battleKeys = {
  all: ['battles'] as const,
  history: () => [...battleKeys.all, 'history'] as const,
}
