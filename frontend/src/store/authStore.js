import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.login({ email, password })
          localStorage.setItem('nextrec_token', data.access_token)
          set({ user: data.user, token: data.access_token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.detail || 'Login failed' }
        }
      },

      register: async (email, username, password, fullName) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.register({ email, username, password, full_name: fullName })
          localStorage.setItem('nextrec_token', data.access_token)
          set({ user: data.user, token: data.access_token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.detail || 'Registration failed' }
        }
      },

      logout: () => {
        localStorage.removeItem('nextrec_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      refreshUser: async () => {
        try {
          const { data } = await authAPI.me()
          set({ user: data })
        } catch {
          get().logout()
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'nextrec-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
