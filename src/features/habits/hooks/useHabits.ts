import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from '../api/habits.api'
import { habitKeys, dailyKeys, todoKeys } from '../queryKeys'
import { useUserStore } from '@/stores/userStore'
import type { Habit, Daily, Todo } from '@/types'

// Habits
export function useHabits() {
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: () => habitsApi.getHabits(),
    staleTime: 1000 * 60, // 1 minute
    select: (data) => data.data,
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Habit>) => habitsApi.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) =>
      habitsApi.updateHabit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsApi.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
    },
  })
}

export function useCompleteHabit() {
  const queryClient = useQueryClient()
  const updateCurrency = useUserStore((state) => state.updateCurrencies)

  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction?: 'up' | 'down' }) =>
      habitsApi.completeHabit(id, direction),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() })
      
      // Update user currency
      const reward = response.data.reward
      updateCurrency({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
    },
  })
}

// Dailies
export function useDailies() {
  return useQuery({
    queryKey: dailyKeys.list(),
    queryFn: () => habitsApi.getDailies(),
    staleTime: 1000 * 60,
    select: (data) => data.data,
  })
}

export function useCreateDaily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Daily>) => habitsApi.createDaily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyKeys.lists() })
    },
  })
}

export function useCompleteDaily() {
  const queryClient = useQueryClient()
  const updateCurrency = useUserStore((state) => state.updateCurrencies)

  return useMutation({
    mutationFn: (id: string) => habitsApi.completeDaily(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: dailyKeys.lists() })
      
      const reward = response.data.reward
      updateCurrency({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
    },
  })
}

// Todos
export function useTodos() {
  return useQuery({
    queryKey: todoKeys.list(),
    queryFn: () => habitsApi.getTodos(),
    staleTime: 1000 * 60,
    select: (data) => data.data,
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Todo>) => habitsApi.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}

export function useCompleteTodo() {
  const queryClient = useQueryClient()
  const updateCurrency = useUserStore((state) => state.updateCurrencies)

  return useMutation({
    mutationFn: (id: string) => habitsApi.completeTodo(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
      
      const reward = response.data.reward
      updateCurrency({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}

// Daily harvest
export function useHarvest() {
  const queryClient = useQueryClient()
  const updateCurrency = useUserStore((state) => state.updateCurrencies)

  return useMutation({
    mutationFn: () => habitsApi.harvest(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: dailyKeys.lists() })
      
      const reward = response.data.totalReward
      updateCurrency({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
    },
  })
}
