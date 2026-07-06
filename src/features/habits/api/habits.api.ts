import { api } from '@/lib/api'
import type { ApiResponse, CurrencyReward, Daily, Habit, PaginatedResponse, Todo } from '@/types'

export const habitsApi = {
  getHabits: () => api.get<PaginatedResponse<Habit>>('/habits'),
  createHabit: (data: Partial<Habit>) => api.post<ApiResponse<Habit>>('/habits', data),
  updateHabit: (id: string, data: Partial<Habit>) =>
    api.patch<ApiResponse<Habit>>(`/habits/${id}`, data),
  deleteHabit: (id: string) => api.delete<void>(`/habits/${id}`),
  completeHabit: (id: string, direction: 'up' | 'down' = 'up') =>
    api.post<ApiResponse<{ reward: CurrencyReward; newStreak: number }>>(
      `/habits/${id}/complete`,
      { direction },
    ),

  getDailies: () => api.get<PaginatedResponse<Daily>>('/dailies'),
  createDaily: (data: Partial<Daily>) =>
    api.post<ApiResponse<Daily>>('/dailies', data),
  completeDaily: (id: string) =>
    api.post<ApiResponse<{ reward: CurrencyReward }>>(`/dailies/${id}/complete`),

  getTodos: () => api.get<PaginatedResponse<Todo>>('/todos'),
  createTodo: (data: Partial<Todo>) => api.post<ApiResponse<Todo>>('/todos', data),
  completeTodo: (id: string) =>
    api.post<ApiResponse<{ reward: CurrencyReward }>>(`/todos/${id}/complete`),
  deleteTodo: (id: string) => api.delete<void>(`/todos/${id}`),

  harvest: () =>
    api.post<ApiResponse<{ totalReward: CurrencyReward; count: number }>>('/habits/harvest'),
}
