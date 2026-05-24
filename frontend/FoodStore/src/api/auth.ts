import { apiRequest } from './client'
import type { ApiLoginRequest, ApiLoginResponse, ApiUserResponse, ApiMessageResponse } from '../types/api'

export async function loginApi(email: string, password: string): Promise<ApiLoginResponse> {
  const body: ApiLoginRequest = { email, password }
  return apiRequest<ApiLoginResponse>('/api/auth/login', {
    method: 'POST',
    body,
  })
}

export async function logoutApi(): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function getMeApi(): Promise<ApiUserResponse> {
  return apiRequest<ApiUserResponse>('/api/auth/me')
}
