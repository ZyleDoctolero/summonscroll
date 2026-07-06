import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { UnderlineTabs, type UnderlineTab } from '@/components/ui/UnderlineTabs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { habitsApi } from '@/features/habits/api/habits.api'
import { useHabitUiStore } from '@/features/habits/store/habitUi.store'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { TodoList } from '@/features/habits/components/TodoList'
import { DailyHarvest } from '@/features/habits/components/DailyHarvest'
import { cn } from '@/lib/utils'
import { createHabitSchema, type CreateHabitInput } from '@/features/habits/schemas/createHabit.schema'
import type { HabitCategory, HabitDifficulty } from '@/types'

export const Route = createFileRoute('/_app/directives')({
  component: () => (
    <ErrorBoundary>
      <DirectivesPage />
    </ErrorBoundary>
  ),
})

type Tab = 'habits' | 'dailies' | 'todos'

const TABS: readonly UnderlineTab<Tab>[] = [
  { id: 'habits',  label: 'Habits',  icon: '🔄' },
  { id: 'dailies', label: 'Dailies', icon: '📅' },
  { id: 'todos',   label: 'To-Dos',  icon: '✅' },
]

const CATEGORIES: HabitCategory[] = ['study', 'fitness', 'meditation', 'sleep', 'nutrition', 'productivity', 'custom']
const DIFFICULTIES: HabitDifficulty[] = ['trivial', 'easy', 'medium', 'hard']

function DirectivesPage() {
  const activeTab = useHabitUiStore((s) => s.directivesTab)
  const setDirectivesTab = useHabitUiStore((s) => s.setDirectivesTab)
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const queryClient = useQueryClient()

  const { data: habitsData, isLoading: habitsLoading, isError: habitsError } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsApi.getHabits,
    enabled: activeTab === 'habits',
  })

  const { data: dailiesData, isLoading: dailiesLoading } = useQuery({
    queryKey: ['dailies'],
    queryFn: habitsApi.getDailies,
    enabled: activeTab === 'dailies',
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateHabitInput>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: { category: 'custom', difficulty: 'medium' },
  })

  const createHabitMutation = useMutation({
    mutationFn: habitsApi.createHabit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] })
      reset()
      setIsAddingHabit(false)
    },
  })

  const completeDailyMutation = useMutation({
    mutationFn: habitsApi.completeDaily,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dailies'] })
    },
  })

  const habits = habitsData?.data ?? []
  const dailies = dailiesData?.data ?? []

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">
      <div className="flex items-center justify-end">
        <DailyHarvest />
      </div>

      <UnderlineTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setDirectivesTab}
        ariaLabel="Directive categories"
      />

      {/* Habits panel */}
      <div
        id="panel-habits"
        role="tabpanel"
        aria-labelledby="tab-habits"
        hidden={activeTab !== 'habits'}
      >
        {activeTab === 'habits' && (
          <div className="space-y-3">
            <button
              onClick={() => setIsAddingHabit((v) => !v)}
              className="flex items-center gap-2 text-14 text-gold hover:text-gold-bright transition-colors"
              aria-expanded={isAddingHabit}
            >
              <span aria-hidden="true">{isAddingHabit ? '✕' : '+'}</span>
              {isAddingHabit ? 'Cancel' : 'Add Habit'}
            </button>

            {isAddingHabit && (
              <form
                onSubmit={handleSubmit((d) => createHabitMutation.mutate(d))}
                className="bg-bg-elevated rounded-lg p-3 space-y-2 border border-border"
              >
                <input
                  type="text"
                  placeholder="Habit name…"
                  {...register('title')}
                  className={cn(
                    'w-full bg-bg-surface border rounded-md px-3 py-2 text-14 text-text-primary',
                    'placeholder:text-text-disabled focus:outline-none focus:border-gold',
                    errors.title ? 'border-danger' : 'border-border',
                  )}
                  aria-label="Habit title"
                />
                {errors.title && (
                  <p className="text-danger text-12" role="alert">{errors.title.message}</p>
                )}
                <div className="flex gap-2">
                  <select
                    {...register('category')}
                    className="flex-1 bg-bg-surface border border-border rounded-md px-2 py-1.5 text-13 text-text-primary focus:outline-none focus:border-gold"
                    aria-label="Category"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <select
                    {...register('difficulty')}
                    className="flex-1 bg-bg-surface border border-border rounded-md px-2 py-1.5 text-13 text-text-primary focus:outline-none focus:border-gold"
                    aria-label="Difficulty"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={createHabitMutation.isPending}
                    className="px-3 py-1.5 bg-gold text-bg-deep rounded-md text-13 font-medium hover:bg-gold-bright transition-colors disabled:opacity-50"
                  >
                    {createHabitMutation.isPending ? '…' : 'Add'}
                  </button>
                </div>
              </form>
            )}

            {habitsLoading && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 w-full rounded-lg" />)}
              </div>
            )}

            {habitsError && (
              <div className="text-danger text-14 text-center py-4">
                Failed to load habits.
              </div>
            )}

            {!habitsLoading && !habitsError && habits.length === 0 && (
              <div className="text-center py-12">
                <p className="text-48 mb-3" aria-hidden="true">📜</p>
                <p className="font-cinzel text-16 text-text-secondary mb-1">
                  Your first habit is your first summon currency.
                </p>
                <p className="text-14 text-text-tertiary">Add a habit to begin earning crystals.</p>
              </div>
            )}

            <ul className="space-y-2" aria-label="Your habits">
              {habits.map((habit) => (
                <li key={habit.id}>
                  <HabitCard habit={habit} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dailies panel */}
      <div
        id="panel-dailies"
        role="tabpanel"
        hidden={activeTab !== 'dailies'}
      >
        {activeTab === 'dailies' && (
          <div className="space-y-2">
            {dailiesLoading && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
              </div>
            )}
            {!dailiesLoading && dailies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-48 mb-3" aria-hidden="true">📅</p>
                <p className="font-cinzel text-16 text-text-secondary mb-1">
                  Your daily rituals await inscription.
                </p>
                <p className="text-14 text-text-tertiary">
                  Dailies reset every day — complete them to maintain your streak.
                </p>
              </div>
            )}
            <ul className="space-y-2" aria-label="Your dailies">
              {dailies.map((daily) => (
                <li
                  key={daily.id}
                  className={cn(
                    'flex items-center gap-3 bg-bg-surface rounded-lg px-3 py-3 border border-border',
                    daily.completedToday && 'opacity-60',
                  )}
                >
                  <button
                    onClick={() => completeDailyMutation.mutate(daily.id)}
                    disabled={daily.completedToday || completeDailyMutation.isPending}
                    className={cn(
                      'w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                      daily.completedToday
                        ? 'bg-success border-success text-bg-deep'
                        : 'border-border-active hover:border-success',
                    )}
                    aria-label={daily.completedToday ? `${daily.title} done` : `Complete ${daily.title}`}
                  >
                    {daily.completedToday && '✓'}
                  </button>
                  <span className={cn('flex-1 text-14 text-text-primary', daily.completedToday && 'line-through text-text-tertiary')}>
                    {daily.title}
                  </span>
                  {daily.streakCount > 0 && (
                    <span className="font-serif text-12 text-warning">🔥 {daily.streakCount}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Todos panel */}
      <div
        id="panel-todos"
        role="tabpanel"
        hidden={activeTab !== 'todos'}
      >
        {activeTab === 'todos' && <TodoList />}
      </div>
    </AnimatedPage>
  )
}
