import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supplierSchema, type Supplier } from '@supplier-price-control/contracts'
import { Button } from '@/components/ui/button'
import { supplierKeys } from '@/entities/supplier'
import { apiClient } from '@/shared/api/client'

export function SupplierStatusAction({
  organizationId,
  supplier,
  userId,
}: {
  organizationId: string
  supplier: Supplier
  userId: string
}) {
  const { t } = useTranslation('suppliers')
  const queryClient = useQueryClient()
  const [failed, setFailed] = useState(false)
  const action = supplier.archivedAt ? 'restore' : 'archive'
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/organizations/${organizationId}/suppliers/${supplier.id}/${action}`,
        {},
      )
      return supplierSchema.parse(response.data.data)
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        supplierKeys.detail(userId, organizationId, supplier.id),
        saved,
      )
      await queryClient.invalidateQueries({ queryKey: supplierKeys.all(userId, organizationId) })
      setFailed(false)
    },
    onError: () => setFailed(true),
  })
  const run = () => {
    if (action === 'archive' && !window.confirm(t('lifecycle.confirmArchive', { name: supplier.name }))) return
    mutation.mutate()
  }

  return (
    <div className="space-y-2">
      <Button
        disabled={mutation.isPending}
        onClick={run}
        type="button"
        variant={action === 'archive' ? 'destructive' : 'outline'}
      >
        {t(mutation.isPending ? 'lifecycle.working' : `lifecycle.${action}`)}
      </Button>
      {failed && <p className="text-sm text-destructive" role="alert">{t('lifecycle.failed')}</p>}
    </div>
  )
}
