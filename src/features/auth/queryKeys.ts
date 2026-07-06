export const authKeys = {
  all: ['auth'] as const,
  user: ['auth', 'user'] as const,
  session: ['auth', 'session'] as const,
  me: () => [...authKeys.user, 'me'] as const,
}
