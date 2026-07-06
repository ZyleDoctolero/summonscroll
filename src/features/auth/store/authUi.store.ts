import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AuthUiState {
  isLoginMode: boolean
  setIsLoginMode: (mode: boolean) => void
  reset: () => void
}

const initialState: Pick<AuthUiState, 'isLoginMode'> = {
  isLoginMode: true,
}

export const useAuthUiStore = create<AuthUiState>()(
  devtools(
    (set) => ({
      ...initialState,
      setIsLoginMode: (mode) =>
        set({ isLoginMode: mode }, false, 'setIsLoginMode'),
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'AuthUiStore' },
  ),
)
