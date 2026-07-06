import { api } from '@/lib/api'
import type {
  ApiResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types'

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  logout: () => api.post<void>('/auth/logout'),
}
