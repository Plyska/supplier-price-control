import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../shared/api/client'

export const organizationSchema = z.object({
  id: z.uuid(), name: z.string(), timeZone: z.string().nullable(), role: z.enum(['owner', 'editor', 'viewer']),
})
export type Organization = z.infer<typeof organizationSchema>

export function useOrganizations(userId: string) {
  return useQuery({
    queryKey: ['organizations', userId],
    queryFn: async ({ signal }) => organizationSchema.array().parse((await apiClient.get('/organizations', { signal })).data.data),
  })
}

export function useOrganization(userId: string, organizationId: string) {
  return useQuery({
    queryKey: ['organization', userId, organizationId],
    queryFn: async ({ signal }) => organizationSchema.parse((await apiClient.get(`/organizations/${organizationId}`, { signal })).data.data),
    staleTime: 0,
  })
}
