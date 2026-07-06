import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authApi } from '../api/auth.api'
import { authKeys } from '../queryKeys'
import { useUserStore } from '@/stores/userStore'
import type { LoginRequest, RegisterRequest } from '@/types'

export function useMe() {
  const { accessToken } = useUserStore()

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authApi.me(),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.data,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { setUser, setTokens } = useUserStore()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (res) => {
      setUser(res.data.user)
      setTokens(res.data.tokens)
      queryClient.setQueryData(authKeys.me(), { data: res.data.user })
      void navigate({ to: '/hub' })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { setUser, setTokens } = useUserStore()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (res) => {
      setUser(res.data.user)
      setTokens(res.data.tokens)
      queryClient.setQueryData(authKeys.me(), { data: res.data.user })
      void navigate({ to: '/hub' })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { logout } = useUserStore()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      queryClient.removeQueries({ queryKey: authKeys.user })
      void navigate({ to: '/auth/login' })
    },
  })
}
