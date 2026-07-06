export const profileKeys = {
  all: ['profile'] as const,
  achievements: () => [...profileKeys.all, 'achievements'] as const,
}
