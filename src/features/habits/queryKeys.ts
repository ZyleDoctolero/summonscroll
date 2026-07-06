export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: () => [...habitKeys.lists()] as const,
  detail: (id: string) => [...habitKeys.all, id] as const,
}

export const dailyKeys = {
  all: ['dailies'] as const,
  lists: () => [...dailyKeys.all, 'list'] as const,
  list: () => [...dailyKeys.lists()] as const,
}

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: () => [...todoKeys.lists()] as const,
}
