import { apiClient } from './client'

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
