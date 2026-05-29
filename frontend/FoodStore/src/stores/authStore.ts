import { create } from 'zustand'
import { loginApi, registerApi, getMeApi, logoutApi } from '../api/auth'
import { mapUser } from '../api/mappers'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'cook' | 'cashier' | 'manager' | 'delivery' | 'customer'
  avatar?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  _isHydrated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
  checkAuth: () => Promise<boolean>
}

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cook: 'Cocina',
  cashier: 'Caja',
  manager: 'Gerente',
  delivery: 'Repartidor',
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  _isHydrated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await loginApi(email, password)
      // El backend setea la cookie HttpOnly automáticamente
      set({
        user: mapUser(res.user),
        isAuthenticated: true,
        isLoading: false,
        _isHydrated: true,
      })
      return true
    } catch {
      set({ isLoading: false, _isHydrated: true })
      return false
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const res = await registerApi(data)
      set({
        user: mapUser(res.user),
        isAuthenticated: true,
        isLoading: false,
        _isHydrated: true,
      })
      return true
    } catch {
      set({ isLoading: false, _isHydrated: true })
      return false
    }
  },

  logout: async () => {
    try {
      await logoutApi()
    } catch {
      // Si el backend ya expiró o no responde, igual limpiamos el estado local
    }
    set({ user: null, isAuthenticated: false, _isHydrated: true })
  },

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  checkAuth: async () => {
    try {
      const apiUser = await getMeApi()
      set({
        user: mapUser(apiUser),
        isAuthenticated: true,
        _isHydrated: true,
      })
      return true
    } catch {
      set({ user: null, isAuthenticated: false, _isHydrated: true })
      return false
    }
  },
}))
