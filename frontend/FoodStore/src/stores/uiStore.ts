import { create } from 'zustand'

export type View = 'login' | 'dashboard' | 'orders' | 'kds' | 'client-logos'

interface UIState {
  currentView: View
  setCurrentView: (view: View) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  selectedLocation: string
  setSelectedLocation: (location: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'login',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectedLocation: 'Ciudad Universitaria',
  setSelectedLocation: (location) => set({ selectedLocation: location }),
}))
