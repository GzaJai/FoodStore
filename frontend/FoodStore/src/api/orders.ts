import { apiRequest } from './client'
import type { ApiOrderResponse, ApiOrderStatus, ApiOrderChannel, ApiOrderCreate, ApiOrderStatusUpdate, ApiMessageResponse } from '../types/api'

export interface ListOrdersParams {
  status?: ApiOrderStatus
  channel?: ApiOrderChannel
  search?: string
  date?: string
  page?: number
  per_page?: number
}

export async function listOrdersApi(params?: ListOrdersParams): Promise<ApiOrderResponse[]> {
  return apiRequest<ApiOrderResponse[]>('/api/orders', { params: params as Record<string, string | number | boolean | undefined> })
}

export async function getOrderApi(id: number): Promise<ApiOrderResponse> {
  return apiRequest<ApiOrderResponse>(`/api/orders/${id}`)
}

export async function createOrderApi(body: ApiOrderCreate): Promise<ApiOrderResponse> {
  return apiRequest<ApiOrderResponse>('/api/orders', { method: 'POST', body })
}

export async function updateOrderStatusApi(id: number, status: ApiOrderStatus): Promise<ApiOrderResponse> {
  const body: ApiOrderStatusUpdate = { status }
  return apiRequest<ApiOrderResponse>(`/api/orders/${id}/status`, { method: 'PATCH', body })
}

export async function cancelOrderApi(id: number): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/orders/${id}`, { method: 'DELETE' })
}
