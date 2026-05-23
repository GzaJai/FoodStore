import { apiRequest } from './client'
import type {
  ApiProductCategoryResponse,
  ApiProductCategoryCreate,
  ApiProductCategoryUpdate,
  ApiMessageResponse,
} from '../types/api'

export function listProductCategoriesApi(): Promise<ApiProductCategoryResponse[]> {
  return apiRequest<ApiProductCategoryResponse[]>('/api/product-categories')
}

export function createProductCategoryApi(
  body: ApiProductCategoryCreate,
): Promise<ApiProductCategoryResponse> {
  return apiRequest<ApiProductCategoryResponse>('/api/product-categories', {
    method: 'POST',
    body,
  })
}

export function updateProductCategoryApi(
  categoryId: string,
  body: ApiProductCategoryUpdate,
): Promise<ApiProductCategoryResponse> {
  return apiRequest<ApiProductCategoryResponse>(`/api/product-categories/${categoryId}`, {
    method: 'PATCH',
    body,
  })
}

export function deactivateProductCategoryApi(
  categoryId: string,
): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/product-categories/${categoryId}`, {
    method: 'DELETE',
  })
}
