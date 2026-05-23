import { create } from 'zustand'
import { getDashboardMetricsApi, getOpenOrdersApi } from '../api/dashboard'
import { mapDashboardMetrics, mapOrder, type DashboardData } from '../api/mappers'
import type { Order } from './orderStore'

interface DashboardState {
  metrics: DashboardData | null
  openOrders: Order[]
  isLoading: boolean
  error: string | null
  fetchMetrics: (date?: string) => Promise<void>
  fetchOpenOrders: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  openOrders: [],
  isLoading: false,
  error: null,

  fetchMetrics: async (date?: string) => {
    set({ isLoading: true, error: null })
    try {
      const apiMetrics = await getDashboardMetricsApi(date)
      set({
        metrics: mapDashboardMetrics(apiMetrics),
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error al cargar métricas',
      })
    }
  },

  fetchOpenOrders: async () => {
    try {
      const apiOrders = await getOpenOrdersApi()
      set({ openOrders: apiOrders.map(mapOrder) })
    } catch {
      // Silently fail — orders might be loaded from orderStore
    }
  },
}))
