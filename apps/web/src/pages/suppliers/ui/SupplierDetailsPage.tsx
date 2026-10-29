import { ArrowLeft, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, m } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { useOrganization } from '@/entities/organization'
import { useSession } from '@/entities/session'
import { useSupplier } from '@/entities/supplier'
import { SupplierForm, SupplierStatusAction } from '@/features/manage-supplier'
import { isApiError } from '@/shared/api/client'
import { backdropVariants, dialogTransition, dialogVariants } from '@/shared/config/motion'
import { SupplierOverviewPreview } from './SupplierOverviewPreview'

export function SupplierDetailsPage() {
  const [saved, setSaved] = useState(false)
  const [isEditOpen, setEditOpen] = useState(false)
  const { organizationId = '', supplierId = '' } = useParams()
  const session = useSession()
  const userId = session.data?.user.userId ?? ''
  const organization = useOrganization(userId, organizationId)
  const supplier = useSupplier(userId, organizationId, supplierId)
  const { t } = useTranslation('suppliers')
  const canWrite = organization.data?.role === 'owner' || organization.data?.role === 'editor'
  const listHref = `/organizations/${organizationId}/suppliers`

  if (supplier.isPending) return <p role="status">{t('details.loading')}</p>
  if (supplier.isError) {
    const status = isApiError(supplier.error) ? supplier.error.response?.status : undefined
    return (
      <div className="space-y-4" role="alert">
        <p>{t(status === 404 ? 'details.notFound' : 'error.description')}</p>
        <div className="flex gap-3">
          <Button onClick={() => void supplier.refetch()} type="button" variant="outline">{t('error.retry')}</Button>
          <Link className={buttonVariants({ size: 'sm', variant: 'outline' })} to={listHref}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t('details.back')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Dialog.Root onOpenChange={setEditOpen} open={isEditOpen}>
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="space-y-5 border-b pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Link className={buttonVariants({ size: 'sm', variant: 'outline' })} to={listHref}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('details.back')}
            </Link>
            {canWrite && <div className="ml-auto flex items-start gap-2">
              {!supplier.data.archivedAt && <Dialog.Trigger asChild>
                <Button
                  aria-label={t('details.edit')}
                  title={t('details.edit')}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <Settings aria-hidden="true" className="size-4" />
                </Button>
              </Dialog.Trigger>}
              <SupplierStatusAction
                organizationId={organizationId}
                supplier={supplier.data}
                userId={userId}
              />
            </div>}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="min-w-0 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{supplier.data.name}</h1>
              <Badge variant="secondary">{t(supplier.data.archivedAt ? 'card.archived' : 'details.active')}</Badge>
            </div>
            {supplier.data.notes && <p
              aria-label={t('form.notes')}
              className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]"
            >{supplier.data.notes}</p>}
            {supplier.data.archivedAt && <p className="text-sm text-muted-foreground">{t('details.archivedDescription')}</p>}
          </div>
        </header>
        {saved && <p className="text-sm" role="status">{t('form.result.success')}</p>}
        <SupplierOverviewPreview />
      </section>
      <Dialog.Portal forceMount>
        <AnimatePresence initial={false}>
          {isEditOpen && canWrite && !supplier.data.archivedAt && <>
            <Dialog.Overlay asChild forceMount>
              <m.div animate="visible" className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm" exit="hidden" initial="hidden" variants={backdropVariants} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div animate="visible" className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[calc(100dvh-2rem)] w-auto max-w-md -translate-y-1/2 overflow-y-auto rounded-card border bg-card p-6 shadow-lg focus:outline-none sm:inset-x-0" exit="hidden" initial="hidden" transition={dialogTransition} variants={dialogVariants}>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <Dialog.Title className="text-lg font-semibold">{t('details.profile')}</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">{t('details.profileDescription')}</Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <Button aria-label={t('form.closeDialog')} size="icon" variant="ghost">
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                <SupplierForm
                  onSaved={() => { setSaved(true); setEditOpen(false) }}
                  organizationId={organizationId}
                  supplier={supplier.data}
                  userId={userId}
                />
              </m.div>
            </Dialog.Content>
          </>}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
