import { apiRequest } from './client'
import type { ApiOrderResponse, ProductPage } from '../types/api'

export async function listPublicProductsApi(params?: {
  page?: number
  per_page?: number
}): Promise<ProductPage> {
  return apiRequest<ProductPage>('/api/public/products', {
    params: params as Record<string, number | undefined>,
  })
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
  })
}
