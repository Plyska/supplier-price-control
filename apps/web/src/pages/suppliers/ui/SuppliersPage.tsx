import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { SupplierListQuery } from '@supplier-price-control/contracts'
import { useOrganization } from '@/entities/organization'
import { useSession } from '@/entities/session'
import { useSuppliers } from '@/entities/supplier'
import { SupplierForm } from '@/features/manage-supplier'
import { syntheticSuppliers } from '../model/synthetic-suppliers'
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
          <Button onClick={() => { setCreatedName(null); setShowCreate((value) => !value) }} type="button">
            {t(showCreate ? 'actions.cancelCreate' : 'actions.add')}
          </Button>
        )}
      </div>

      {createdName && <p role="status" className="text-sm">{t('created', { name: createdName })}</p>}
      {showCreate && canWrite && !previewState && (
        <Card>
          <CardHeader><CardTitle>{t('form.createTitle')}</CardTitle></CardHeader>
          <CardContent>
            <SupplierForm
              onSaved={(supplier) => { setCreatedName(supplier.name); setShowCreate(false) }}
              organizationId={organizationId}
              userId={userId}
            />
          </CardContent>
        </Card>
      )}

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
          <select
            aria-label={t('filters.status')}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) => updateParams({ page: null, status: event.target.value === 'active' ? null : event.target.value })}
            value={query.status}
          >
            <option value="active">{t('filters.active')}</option>
            <option value="archived">{t('filters.archived')}</option>
            <option value="all">{t('filters.all')}</option>
          </select>
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
