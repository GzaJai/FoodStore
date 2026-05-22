import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'cook' | 'cashier' | 'manager'
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cook: 'Cocina',
  cashier: 'Caja',
  manager: 'Gerente',
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (email && password) {
      const isKitchen = email.includes('cocina') || email.includes('kitchen')
      set({
        user: {
          id: '1',
          name: email.includes('admin') ? 'Admin User' : email.includes('cocina') ? 'Carlos Cocina' : 'Usuario FoodStore',
          email,
          phone: '+54 9 11 1234-5678',
          role: isKitchen ? 'cook' : 'admin',
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
  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null,
  })),
}))

export { roleLabels }
