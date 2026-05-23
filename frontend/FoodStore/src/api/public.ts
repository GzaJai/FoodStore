import { apiRequest } from './client'
import type { ApiProductResponse, ApiOrderResponse } from '../types/api'

export async function listPublicProductsApi(): Promise<ApiProductResponse[]> {
  return apiRequest<ApiProductResponse[]>('/api/public/products', { auth: false })
}

export interface PublicOrderPayload {
  customer_name: string
  customer_phone?: string
  customer_email?: string
  channel: 'DELIVERY' | 'TABLE' | 'TAKEAWAY'
  address?: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    extras?: string[]
  }[]
}

export async function createPublicOrderApi(body: PublicOrderPayload): Promise<ApiOrderResponse> {
  return apiRequest<ApiOrderResponse>('/api/public/orders', {
    method: 'POST',
    body,
    auth: false,
  })
}
