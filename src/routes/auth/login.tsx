import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'
import { loginSchema, type LoginInput } from '@/features/auth/schemas/login.schema'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setTokens } = useUserStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      setUser(res.data.user)
      setTokens(res.data.tokens)
      void navigate({ to: '/hub' })
    },
  })

  const onSubmit = (data: LoginInput) => {
    mutation.mutate(data)
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: 'url(/images/summonscroll/bg_login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-bg-deep/80 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel font-bold text-32 text-gold-bright tracking-wide">
            SummonScroll
          </h1>
          <p className="text-text-secondary text-14 mt-2">
            Your habits. Your monsters. Your legend.
          </p>
        </div>

        <div
          className="bg-bg-surface/80 backdrop-blur-xl border border-[#3d2e1f]/10 rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Neon inner glow top border */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
          
          <h2 className="font-cinzel font-semibold text-20 text-text-primary mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={cn(
                    'w-full bg-bg-elevated border rounded-md px-3 py-2.5 pr-10 text-14 text-text-primary',
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
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-danger text-12 mt-1" role="alert">
                  {errors.password.message}
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
                  : 'Login failed. Check your credentials.'}
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
              {mutation.isPending ? 'Summoning…' : 'Enter the Realm'}
            </button>
          </form>

          <p className="text-center text-text-secondary text-13 mt-4">
            New summoner?{' '}
            <Link
              to="/auth/register"
              className="text-gold hover:text-gold-bright transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
