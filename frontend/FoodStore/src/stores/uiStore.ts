import { create } from 'zustand'

export type View = 'login' | 'dashboard' | 'orders' | 'kds' | 'client-logos' | 'profile' | 'public-menu'
export type WSStatus = 'connecting' | 'connected' | 'disconnected'

interface UIState {
  currentView: View
  setCurrentView: (view: View) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  wsStatus: WSStatus
  setWsStatus: (status: WSStatus) => void
  /** Contador que incrementa cada 30s para forzar re-render de los elapsed times */
  tick: number
  bumpTick: () => void
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'login',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  wsStatus: 'disconnected',
  setWsStatus: (status) => set({ wsStatus: status }),
  tick: 0,
  bumpTick: () => set((state) => ({ tick: state.tick + 1 })),
}))
