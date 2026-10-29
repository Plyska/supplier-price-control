import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, m } from 'motion/react'
import { X } from 'lucide-react'
import { supplierSchema, type Supplier } from '@supplier-price-control/contracts'
import { Button } from '@/components/ui/button'
import { supplierKeys } from '@/entities/supplier'
import { apiClient } from '@/shared/api/client'
import { backdropVariants, dialogTransition, dialogVariants } from '@/shared/config/motion'

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
  const [isConfirmOpen, setConfirmOpen] = useState(false)
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
    mutation.mutate()
  }

  const requestAction = () => {
    if (action === 'archive') setConfirmOpen(true)
    else run()
  }

  return (
    <div className="space-y-2">
      <Dialog.Root onOpenChange={setConfirmOpen} open={isConfirmOpen}>
        <Button
          disabled={mutation.isPending}
          onClick={requestAction}
          size="sm"
          type="button"
          variant={action === 'archive' ? 'destructive' : 'outline'}
        >
          {t(mutation.isPending ? 'lifecycle.working' : `lifecycle.${action}`)}
        </Button>
        <Dialog.Portal forceMount>
          <AnimatePresence initial={false}>
            {isConfirmOpen && <>
              <Dialog.Overlay asChild forceMount>
                <m.div animate="visible" className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm" exit="hidden" initial="hidden" variants={backdropVariants} />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <m.div animate="visible" className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-md -translate-y-1/2 rounded-card border bg-card p-6 shadow-lg focus:outline-none sm:inset-x-0" exit="hidden" initial="hidden" transition={dialogTransition} variants={dialogVariants}>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <Dialog.Title className="text-lg font-semibold">{t('lifecycle.confirmTitle')}</Dialog.Title>
                      <Dialog.Description className="text-sm leading-6 text-muted-foreground">
                        {t('lifecycle.confirmArchive', { name: supplier.name })}
                      </Dialog.Description>
                    </div>
                    <Dialog.Close asChild>
                      <Button aria-label={t('form.closeDialog')} size="icon" variant="ghost">
                        <X aria-hidden="true" className="size-4" />
                      </Button>
                    </Dialog.Close>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline">{t('lifecycle.cancel')}</Button>
                    </Dialog.Close>
                    <Button
                      onClick={() => { setConfirmOpen(false); run() }}
                      type="button"
                      variant="destructive"
                    >
                      {t('lifecycle.archive')}
                    </Button>
                  </div>
                </m.div>
              </Dialog.Content>
            </>}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
      {failed && <p className="text-sm text-destructive" role="alert">{t('lifecycle.failed')}</p>}
    </div>
  )
}
