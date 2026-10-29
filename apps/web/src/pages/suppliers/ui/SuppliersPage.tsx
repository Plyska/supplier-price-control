import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, ChevronDown, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SupplierListQuery } from '@supplier-price-control/contracts'
import { useOrganization } from '@/entities/organization'
import { useSession } from '@/entities/session'
import { useSuppliers } from '@/entities/supplier'
import { SupplierForm } from '@/features/manage-supplier'
import { syntheticSuppliers } from '../model/synthetic-suppliers'
import { backdropVariants, dialogTransition, dialogVariants, dropdownVariants } from '@/shared/config/motion'
import {
  SuppliersEmptyState,
  SuppliersErrorState,
  SuppliersLoadingState,
  SuppliersPopulatedState,
} from './SuppliersStates'

const previewStates = ['error', 'loading', 'populated'] as const
type PreviewState = (typeof previewStates)[number]

function isPreviewState(value: string | null): value is PreviewState {
  return previewStates.some((state) => state === value)
}

export function SuppliersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)
  const [createdName, setCreatedName] = useState<string | null>(null)
  const [isStatusOpen, setStatusOpen] = useState(false)
  const { organizationId = '' } = useParams()
  const session = useSession()
  const userId = session.data?.user.userId ?? ''
  const organization = useOrganization(userId, organizationId)
  const { t } = useTranslation('suppliers')
  const previewParam = searchParams.get('preview')
  const previewState =
    import.meta.env.DEV && isPreviewState(previewParam) ? previewParam : null
  const pageValue = Number(searchParams.get('page') ?? '1')
  const statusValue = searchParams.get('status')
  const query: SupplierListQuery = {
    page: Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize: 12,
    q: searchParams.get('q')?.trim() ?? '',
    status: statusValue === 'archived' || statusValue === 'all' ? statusValue : 'active',
  }
  const suppliers = useSuppliers(userId, organizationId, query, !previewState)
  const canWrite = organization.data?.role === 'owner' || organization.data?.role === 'editor'

  const retryPreview = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('preview', 'populated')
    setSearchParams(nextSearchParams, { replace: true })
  }

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    next.delete('preview')
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next)
  }

  let content = suppliers.data?.items.length
    ? <SuppliersPopulatedState
        detailsHref={(supplier) => `/organizations/${organizationId}/suppliers/${supplier.id}`}
        suppliers={suppliers.data.items}
        total={suppliers.data.pagination.total}
      />
    : <SuppliersEmptyState filtered={Boolean(query.q) || query.status !== 'active'} />

  if (!previewState && suppliers.isPending) content = <SuppliersLoadingState />
  if (!previewState && suppliers.isError) content = <SuppliersErrorState onRetry={() => void suppliers.refetch()} />

  if (previewState === 'loading') {
    content = <SuppliersLoadingState />
  }

  if (previewState === 'error') {
    content = <SuppliersErrorState onRetry={retryPreview} />
  }

  if (previewState === 'populated') {
    content = <SuppliersPopulatedState suppliers={syntheticSuppliers} synthetic />
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl space-y-4">
          <Badge variant="secondary">{t('eyebrow')}</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{t('title')}</h1>
          <p className="max-w-2xl leading-7 text-muted-foreground">{t('description')}</p>
        </div>
        {canWrite && !previewState && (
          <Button onClick={() => { setCreatedName(null); setShowCreate(true) }} type="button">
            {t('actions.add')}
          </Button>
        )}
      </div>

      {createdName && <p role="status" className="text-sm">{t('created', { name: createdName })}</p>}
      {canWrite && !previewState && <CreateSupplierDialog
        onOpenChange={setShowCreate}
        onSaved={(supplier) => { setCreatedName(supplier.name); setShowCreate(false) }}
        open={showCreate}
        organizationId={organizationId}
        userId={userId}
      />}

      {!previewState && (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const value = new FormData(event.currentTarget).get('q')
            updateParams({ page: null, q: typeof value === 'string' ? value.trim() : null })
          }}
        >
          <Input defaultValue={query.q} key={query.q} name="q" placeholder={t('filters.search')} />
          <StatusFilter
            onChange={(status) => updateParams({ page: null, status: status === 'active' ? null : status })}
            onOpenChange={setStatusOpen}
            open={isStatusOpen}
            status={query.status}
          />
          <Button type="submit" variant="outline">{t('filters.submit')}</Button>
        </form>
      )}

      {content}

      {!previewState && suppliers.data && suppliers.data.pagination.totalPages > 1 && (
        <nav aria-label={t('pagination.label')} className="flex items-center justify-between gap-4">
          <Button
            disabled={query.page <= 1}
            onClick={() => updateParams({ page: String(query.page - 1) })}
            type="button"
            variant="outline"
          >
            {t('pagination.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('pagination.current', { page: query.page, total: suppliers.data.pagination.totalPages })}
          </span>
          <Button
            disabled={query.page >= suppliers.data.pagination.totalPages}
            onClick={() => updateParams({ page: String(query.page + 1) })}
            type="button"
            variant="outline"
          >
            {t('pagination.next')}
          </Button>
        </nav>
      )}
    </section>
  )
}

function CreateSupplierDialog({
  onOpenChange,
  onSaved,
  open,
  organizationId,
  userId,
}: {
  onOpenChange: (open: boolean) => void
  onSaved: (supplier: { name: string }) => void
  open: boolean
  organizationId: string
  userId: string
}) {
  const { t } = useTranslation('suppliers')

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal forceMount>
        <AnimatePresence initial={false}>
          {open && <>
            <Dialog.Overlay asChild forceMount>
              <m.div animate="visible" className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm" exit="hidden" initial="hidden" variants={backdropVariants} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div animate="visible" className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-md -translate-y-1/2 rounded-card border bg-card p-6 shadow-lg focus:outline-none sm:inset-x-0" exit="hidden" initial="hidden" transition={dialogTransition} variants={dialogVariants}>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <Dialog.Title className="text-lg font-semibold">{t('form.createTitle')}</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">{t('form.createDescription')}</Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <Button aria-label={t('form.closeDialog')} size="icon" variant="ghost">
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                <SupplierForm organizationId={organizationId} onSaved={onSaved} userId={userId} />
              </m.div>
            </Dialog.Content>
          </>}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function StatusFilter({
  onChange,
  onOpenChange,
  open,
  status,
}: {
  onChange: (status: 'active' | 'archived' | 'all') => void
  onOpenChange: (open: boolean) => void
  open: boolean
  status: 'active' | 'archived' | 'all'
}) {
  const { t } = useTranslation('suppliers')
  const options = ['active', 'archived', 'all'] as const

  return (
    <DropdownMenu.Root onOpenChange={onOpenChange} open={open}>
      <DropdownMenu.Trigger asChild>
        <Button
          aria-label={t('filters.status')}
          className="min-w-28 justify-center"
          type="button"
          variant="outline"
        >
          {t(`filters.${status}`)}
          <m.span animate={{ rotate: open ? 180 : 0 }} aria-hidden="true" transition={{ duration: 0.15 }}>
            <ChevronDown className="size-3.5" />
          </m.span>
        </Button>
      </DropdownMenu.Trigger>
      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content align="start" asChild forceMount sideOffset={8}>
              <m.div
                animate="visible"
                className="z-50 w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-overlay outline-none"
                exit="hidden"
                initial="hidden"
                style={{ transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)' }}
                variants={dropdownVariants}
              >
                {options.map((option) => (
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent"
                    key={option}
                    onSelect={() => onChange(option)}
                  >
                    {t(`filters.${option}`)}
                    {status === option && <Check aria-hidden="true" className="size-4" />}
                  </DropdownMenu.Item>
                ))}
              </m.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  )
}
