import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'cook' | 'cashier' | 'manager'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    // Simulación de login
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    if (email && password) {
      set({
        user: {
          id: '1',
          name: 'Admin User',
          email,
          role: 'admin',
        },
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    }
    set({ isLoading: false })
    return false
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}))
