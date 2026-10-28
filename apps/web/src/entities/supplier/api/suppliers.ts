import { useQuery } from '@tanstack/react-query'
import {
  supplierListSchema,
  supplierSchema,
  type SupplierListQuery,
} from '@supplier-price-control/contracts'
import { apiClient } from '@/shared/api/client'

export const supplierKeys = {
  all: (userId: string, organizationId: string) => ['suppliers', userId, organizationId] as const,
  detail: (userId: string, organizationId: string, supplierId: string) => [
    'supplier', userId, organizationId, supplierId,
  ] as const,
  list: (userId: string, organizationId: string, query: SupplierListQuery) => [
    ...supplierKeys.all(userId, organizationId), query,
  ] as const,
}

export function useSuppliers(
  userId: string,
  organizationId: string,
  query: SupplierListQuery,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && Boolean(userId && organizationId),
    queryKey: supplierKeys.list(userId, organizationId, query),
    queryFn: async ({ signal }) => {
      const response = await apiClient.get(`/organizations/${organizationId}/suppliers`, {
        params: query,
        signal,
      })
      return supplierListSchema.parse(response.data.data)
    },
  })
}

export function useSupplier(userId: string, organizationId: string, supplierId: string) {
  return useQuery({
    enabled: Boolean(userId && organizationId && supplierId),
    queryKey: supplierKeys.detail(userId, organizationId, supplierId),
    queryFn: async ({ signal }) => {
      const response = await apiClient.get(
        `/organizations/${organizationId}/suppliers/${supplierId}`,
        { signal },
      )
      return supplierSchema.parse(response.data.data)
    },
  })
}
