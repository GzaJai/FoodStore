import { apiRequest } from './client'
import type { ApiDashboardMetrics, ApiOrderResponse } from '../types/api'

export async function getDashboardMetricsApi(date?: string): Promise<ApiDashboardMetrics> {
  return apiRequest<ApiDashboardMetrics>('/api/dashboard/metrics', {
    params: date ? { date } : undefined,
  })
}

export async function getOpenOrdersApi(): Promise<ApiOrderResponse[]> {
  return apiRequest<ApiOrderResponse[]>('/api/dashboard/open-orders')
}
