import { apiClient } from './client'

export const healthQueryKey = ['api', 'health'] as const

export type HealthResponse = {
  data: {
    status: 'ok'
  }
  requestId: string
}

export async function getApiHealth(signal?: AbortSignal) {
  const response = await apiClient.get<HealthResponse>('/health', { signal })

  return response.data
}
