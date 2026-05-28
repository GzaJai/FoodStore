import { apiRequest } from './client'
import type {
  ApiProductResponse,
  ApiProductCreate,
  ApiProductUpdate,
  ApiMessageResponse,
  ProductPage,
} from '../types/api'

export function listProductsApi(params?: {
  category_id?: string
  search?: string
  active?: boolean
  page?: number
  per_page?: number
}): Promise<ProductPage> {
  return apiRequest<ProductPage>('/api/products', {
    params: params as Record<string, string | number | boolean | undefined>,
  })
}

export function createProductApi(body: ApiProductCreate): Promise<ApiProductResponse> {
  console.log(body);
  
  return apiRequest<ApiProductResponse>('/api/products', {
    method: 'POST',
    body,
  })
}

export function updateProductApi(
  productId: string,
  body: ApiProductUpdate,
): Promise<ApiProductResponse> {
  return apiRequest<ApiProductResponse>(`/api/products/${productId}`, {
    method: 'PATCH',
    body,
  })
}

export function deactivateProductApi(productId: string): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/products/${productId}`, {
    method: 'DELETE',
  })
}
