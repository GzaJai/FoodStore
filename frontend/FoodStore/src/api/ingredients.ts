import { apiRequest } from './client'
import type {
  ApiIngredientResponse,
  ApiIngredientCreate,
  ApiIngredientUpdate,
  ApiMessageResponse,
  IngredientPage,
} from '../types/api'

export function listIngredientsApi(params?: {
  search?: string
  page?: number
  per_page?: number
}): Promise<IngredientPage> {
  return apiRequest<IngredientPage>('/api/ingredients', {
    params: params as Record<string, string | number | boolean | undefined>,
  })
}

export function createIngredientApi(body: ApiIngredientCreate): Promise<ApiIngredientResponse> {
  return apiRequest<ApiIngredientResponse>('/api/ingredients', {
    method: 'POST',
    body,
  })
}

export function updateIngredientApi(
  ingredientId: string,
  body: ApiIngredientUpdate,
): Promise<ApiIngredientResponse> {
  return apiRequest<ApiIngredientResponse>(`/api/ingredients/${ingredientId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteIngredientApi(ingredientId: string): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/ingredients/${ingredientId}`, {
    method: 'DELETE',
  })
}
