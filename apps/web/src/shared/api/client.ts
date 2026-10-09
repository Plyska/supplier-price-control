import axios, { type AxiosError } from 'axios'

export type ApiErrorResponse = {
  error: {
    code: string
    message: string
    requestId: string
  }
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
})

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false
  }

  const { error } = value

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string' &&
    'requestId' in error &&
    typeof error.requestId === 'string'
  )
}

export function isApiError(
  error: unknown,
): error is AxiosError<ApiErrorResponse> {
  return (
    axios.isAxiosError(error) && isApiErrorResponse(error.response?.data)
  )
}
