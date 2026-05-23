import { apiRequest } from './client'
import type { ApiUserResponse, ApiUserUpdate, ApiPasswordChange, ApiMessageResponse } from '../types/api'

export async function updateProfileApi(body: ApiUserUpdate): Promise<ApiUserResponse> {
  return apiRequest<ApiUserResponse>('/api/users/me', { method: 'PATCH', body })
}

export async function changePasswordApi(body: ApiPasswordChange): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>('/api/users/me/password', { method: 'PATCH', body })
}
