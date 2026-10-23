import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient, isApiError } from '../../../shared/api/client'

export const sessionKey = ['session'] as const
const sessionSchema = z.object({ user: z.object({ userId: z.uuid(), email: z.email(), displayName: z.string().nullable() }) })

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }) => {
      try {
        const response = await apiClient.get('/session', { signal })
        return sessionSchema.parse(response.data.data)
      } catch (error) {
        if (isApiError(error) && error.response?.status === 401) return null
        throw error
      }
    },
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  })
}
