// ==========================================
// HTTP Client con autenticación por cookie HttpOnly
// ==========================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params } = options

  // Build URL
  const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)
  const url = new URL(path, baseUrl)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Make request — la cookie HttpOnly se envía automáticamente
  const response = await fetch(url.toString(), {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  // Handle errors
  if (!response.ok) {
    let errorMessage = `Error ${response.status}`
    let errorData: unknown = undefined

    try {
      const errorBody = await response.json()
      errorData = errorBody
      errorMessage = errorBody.detail || errorBody.message || errorMessage
    } catch {
      // ignore parse error
    }

    throw new ApiError(response.status, errorMessage, errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
