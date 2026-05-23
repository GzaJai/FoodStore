import { apiRequest } from './client'
import type { ApiClientCategoryResponse } from '../types/api'

export async function listClientCategoriesApi(): Promise<ApiClientCategoryResponse[]> {
  return apiRequest<ApiClientCategoryResponse[]>('/api/categories/client')
}
