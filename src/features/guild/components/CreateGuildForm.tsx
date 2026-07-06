import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { createGuildSchema, type CreateGuildInput } from '../schemas/createGuild.schema'
import { useCreateGuild } from '../hooks/useGuild'

export interface CreateGuildFormProps {
  onSuccess?: () => void
  className?: string
}

export function CreateGuildForm({ onSuccess, className }: CreateGuildFormProps) {
  const { mutate, isPending } = useCreateGuild()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGuildInput>({
    resolver: zodResolver(createGuildSchema),
  })

  function onSubmit(data: CreateGuildInput) {
    mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess?.()
      },
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('bg-bg-surface rounded-lg p-4 border border-border space-y-4', className)}
      noValidate
    >
      <h2 className="font-cinzel font-semibold text-16 text-text-primary">Create a Guild</h2>

      <div>
        <label htmlFor="guild-name" className="block text-12 font-medium text-text-secondary mb-1 uppercase tracking-wider">
          Guild Name
        </label>
        <input
          id="guild-name"
          type="text"
          placeholder="Spectral Vanguard"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'guild-name-error' : undefined}
          className={cn(
            'w-full bg-bg-elevated border rounded-md px-3 py-2.5 text-14 text-text-primary',
            'placeholder:text-text-disabled focus:outline-none focus:border-gold transition-colors',
            errors.name ? 'border-danger' : 'border-border',
          )}
          {...register('name')}
        />
        {errors.name && (
          <p id="guild-name-error" role="alert" className="mt-1 text-12 text-danger">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="guild-desc" className="block text-12 font-medium text-text-secondary mb-1 uppercase tracking-wider">
          Description <span className="text-text-tertiary normal-case">(optional)</span>
        </label>
        <textarea
          id="guild-desc"
          rows={3}
          placeholder="A guild for dedicated summoners…"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'guild-desc-error' : undefined}
          className={cn(
            'w-full bg-bg-elevated border rounded-md px-3 py-2.5 text-14 text-text-primary',
            'placeholder:text-text-disabled focus:outline-none focus:border-gold transition-colors resize-none',
            errors.description ? 'border-danger' : 'border-border',
          )}
          {...register('description')}
        />
        {errors.description && (
          <p id="guild-desc-error" role="alert" className="mt-1 text-12 text-danger">
            {errors.description.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full py-3 rounded-lg font-medium text-14 transition-all',
          'bg-gold text-bg-deep hover:bg-gold-bright active:scale-[0.97]',
          'focus:outline-none focus:ring-2 focus:ring-gold/60',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isPending ? 'Creating…' : 'Create Guild'}
      </button>
    </form>
  )
}
