import { apiRequest } from './client'
import type { ApiLoginRequest, ApiLoginResponse, ApiUserResponse } from '../types/api'

export async function loginApi(email: string, password: string): Promise<ApiLoginResponse> {
  const body: ApiLoginRequest = { email, password }
  return apiRequest<ApiLoginResponse>('/api/auth/login', {
    method: 'POST',
    body,
    auth: false,
  })
}

export async function getMeApi(): Promise<ApiUserResponse> {
  return apiRequest<ApiUserResponse>('/api/auth/me')
}
