import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas/register.schema'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { setUser, setTokens } = useUserStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      setUser(res.data.user)
      setTokens(res.data.tokens)
      void navigate({ to: '/hub' })
    },
  })

  const onSubmit = (data: RegisterInput) => {
    mutation.mutate({
      username: data.username,
      email: data.email,
      password: data.password,
    })
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/summonscroll/bg_login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel font-bold text-32 text-gold-bright tracking-wide">
            SummonScroll
          </h1>
          <p className="text-text-secondary text-14 mt-2">
            Begin your journey. Build your bestiary.
          </p>
        </div>

        <div
          className="bg-bg-surface/80 backdrop-blur-xl border border-[#3d2e1f]/10 rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Neon inner glow top border */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
          <h2 className="font-cinzel font-semibold text-20 text-text-primary mb-6">
            Create Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-12 font-medium text-text-secondary mb-1 uppercase tracking-wider"
              >
                Summoner Name
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                {...register('username')}
                className={cn(
                  'w-full bg-bg-elevated border rounded-md px-3 py-2.5 text-14 text-text-primary',
                  'placeholder:text-text-disabled transition-colors',
                  'focus:outline-none focus:border-gold',
                  errors.username
                    ? 'border-danger'
                    : 'border-border',
                )}
                placeholder="CrimsonBlade"
                aria-describedby={errors.username ? 'username-error' : undefined}
                aria-invalid={!!errors.username}
              />
              {errors.username && (
                <p id="username-error" className="text-danger text-12 mt-1" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-12 font-medium text-text-secondary mb-1 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={cn(
                  'w-full bg-bg-elevated border rounded-md px-3 py-2.5 text-14 text-text-primary',
                  'placeholder:text-text-disabled transition-colors',
                  'focus:outline-none focus:border-gold',
                  errors.email
                    ? 'border-danger'
                    : 'border-border',
                )}
                placeholder="you@example.com"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p id="email-error" className="text-danger text-12 mt-1" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-12 font-medium text-text-secondary mb-1 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className={cn(
                  'w-full bg-bg-elevated border rounded-md px-3 py-2.5 text-14 text-text-primary',
                  'placeholder:text-text-disabled transition-colors',
                  'focus:outline-none focus:border-gold',
                  errors.password
                    ? 'border-danger'
                    : 'border-border',
                )}
                placeholder="••••••••"
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p id="password-error" className="text-danger text-12 mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-12 font-medium text-text-secondary mb-1 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={cn(
                  'w-full bg-bg-elevated border rounded-md px-3 py-2.5 text-14 text-text-primary',
                  'placeholder:text-text-disabled transition-colors',
                  'focus:outline-none focus:border-gold',
                  errors.confirmPassword
                    ? 'border-danger'
                    : 'border-border',
                )}
                placeholder="••••••••"
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-danger text-12 mt-1" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {mutation.isError && (
              <div
                className="bg-danger/10 border border-danger/30 rounded-md px-3 py-2 text-danger text-13"
                role="alert"
              >
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : 'Registration failed. Please try again.'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className={cn(
                'w-full py-3 rounded-lg font-bold text-14 transition-all uppercase tracking-widest',
                'bg-gradient-to-r from-gold to-gold-bright text-bg-deep hover:brightness-110 shadow-[0_0_15px_rgba(255,184,77,0.4)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-gold/60',
              )}
            >
              {mutation.isPending ? 'Forging Contract…' : 'Begin Your Journey'}
            </button>
          </form>

          <p className="text-center text-text-secondary text-13 mt-4">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-gold hover:text-gold-bright transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
