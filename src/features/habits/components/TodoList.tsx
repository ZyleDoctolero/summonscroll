import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { habitsApi } from '../api/habits.api'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'
import type { HabitDifficulty, Todo } from '@/types'

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard'] as const),
  dueDate: z.string().optional(),
})

type TodoForm = z.infer<typeof todoSchema>

export function TodoList() {
  const queryClient = useQueryClient()
  const { updateCurrencies, updateXp } = useUserStore()
  const [isAdding, setIsAdding] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: habitsApi.getTodos,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TodoForm>({
    resolver: zodResolver(todoSchema),
    defaultValues: { difficulty: 'medium' },
  })

  const createMutation = useMutation({
    mutationFn: habitsApi.createTodo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
      reset()
      setIsAdding(false)
    },
  })

  const completeMutation = useMutation({
    mutationFn: habitsApi.completeTodo,
    onSuccess: (res) => {
      const { reward } = res.data
      updateCurrencies({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
      updateXp(reward.xp)
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: habitsApi.deleteTodo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const onSubmit = (data: TodoForm) => {
    createMutation.mutate(data)
  }

  const todos = data?.data ?? []
  const pending = todos.filter((t) => !t.isCompleted)
  const completed = todos.filter((t) => t.isCompleted)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-danger text-14 text-center py-4">
        Failed to load to-dos. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      <button
        onClick={() => setIsAdding((v) => !v)}
        className="flex items-center gap-2 text-14 text-gold hover:text-gold-bright transition-colors"
        aria-expanded={isAdding}
      >
        <span aria-hidden="true">{isAdding ? '✕' : '+'}</span>
        {isAdding ? 'Cancel' : 'Add To-Do'}
      </button>

      {/* Add form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-bg-elevated rounded-lg p-3 space-y-2 border border-border"
        >
          <input
            type="text"
            placeholder="What needs to be done?"
            {...register('title')}
            className={cn(
              'w-full bg-bg-surface border rounded-md px-3 py-2 text-14 text-text-primary',
              'placeholder:text-text-disabled focus:outline-none focus:border-gold',
              errors.title ? 'border-danger' : 'border-border',
            )}
            aria-label="To-do title"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-danger text-12" role="alert">{errors.title.message}</p>
          )}

          <div className="flex items-center gap-2">
            <select
              {...register('difficulty')}
              className="bg-bg-surface border border-border rounded-md px-2 py-1.5 text-13 text-text-primary focus:outline-none focus:border-gold"
              aria-label="Difficulty"
            >
              {(['trivial', 'easy', 'medium', 'hard'] as HabitDifficulty[]).map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>

            <input
              type="date"
              {...register('dueDate')}
              className="bg-bg-surface border border-border rounded-md px-2 py-1.5 text-13 text-text-primary focus:outline-none focus:border-gold"
              aria-label="Due date (optional)"
            />

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="ml-auto px-3 py-1.5 bg-gold text-bg-deep rounded-md text-13 font-medium hover:bg-gold-bright transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {pending.length === 0 && !isAdding && (
        <div className="text-center py-8">
          <p className="text-32 mb-2" aria-hidden="true">✅</p>
          <p className="font-cinzel text-16 text-text-secondary mb-1">
            All clear — nothing to do.
          </p>
          <p className="text-14 text-text-tertiary">
            Add a to-do to track one-off tasks. Completing them earns crystals.
          </p>
        </div>
      )}

      {/* Pending todos */}
      <ul className="space-y-2" aria-label="Pending to-dos">
        {pending.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onComplete={() => completeMutation.mutate(todo.id)}
            onDelete={() => deleteMutation.mutate(todo.id)}
            isLoading={completeMutation.isPending || deleteMutation.isPending}
          />
        ))}
      </ul>

      {/* Completed todos */}
      {completed.length > 0 && (
        <details className="mt-4">
          <summary className="text-13 text-text-tertiary cursor-pointer hover:text-text-secondary">
            {completed.length} completed
          </summary>
          <ul className="space-y-2 mt-2 opacity-50" aria-label="Completed to-dos">
            {completed.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onComplete={() => {}}
                onDelete={() => deleteMutation.mutate(todo.id)}
                isLoading={deleteMutation.isPending}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  onComplete: () => void
  onDelete: () => void
  isLoading: boolean
}

function TodoItem({ todo, onComplete, onDelete, isLoading }: TodoItemProps) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 bg-bg-surface rounded-md px-3 py-2.5 border border-border',
        todo.isCompleted && 'opacity-60',
      )}
    >
      <button
        onClick={onComplete}
        disabled={todo.isCompleted || isLoading}
        className={cn(
          'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
          todo.isCompleted
            ? 'bg-success border-success text-bg-deep'
            : 'border-border-active hover:border-success',
        )}
        aria-label={todo.isCompleted ? `${todo.title} completed` : `Complete ${todo.title}`}
      >
        {todo.isCompleted && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="currentColor" aria-hidden="true">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span
        className={cn(
          'flex-1 text-14 text-text-primary min-w-0 truncate',
          todo.isCompleted && 'line-through text-text-tertiary',
        )}
      >
        {todo.title}
      </span>

      {todo.dueDate && (
        <span className="text-12 text-text-tertiary flex-shrink-0">
          {new Date(todo.dueDate).toLocaleDateString()}
        </span>
      )}

      <button
        onClick={onDelete}
        disabled={isLoading}
        className="w-6 h-6 flex-shrink-0 text-text-tertiary hover:text-danger transition-colors flex items-center justify-center rounded"
        aria-label={`Delete ${todo.title}`}
      >
        ✕
      </button>
    </li>
  )
}
