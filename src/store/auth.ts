import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserInfo {
  id: string
  name: string
  phone: string
  companyName: string
  companyId: string
  role: string
  avatar?: string
}

interface AuthState {
  token: string | null
  userInfo: UserInfo | null
  isLoggedIn: boolean
  setAuth: (token: string, userInfo: UserInfo) => void
  clearAuth: () => void
  updateUserInfo: (info: Partial<UserInfo>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      isLoggedIn: false,
      setAuth: (token, userInfo) =>
        set({ token, userInfo, isLoggedIn: true }),
      clearAuth: () =>
        set({ token: null, userInfo: null, isLoggedIn: false }),
      updateUserInfo: (info) =>
        set((state) => ({
          userInfo: state.userInfo ? { ...state.userInfo, ...info } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
)
