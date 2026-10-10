import { AlertTriangle, PackageOpen, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SupplierCard, type SupplierSummary } from '@/entities/supplier'

function SuppliersLoadingState() {
  const { t } = useTranslation('suppliers')

  return (
    <div
      aria-busy="true"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      <span className="sr-only">{t('loading.ariaLabel')}</span>
      {Array.from({ length: 3 }, (_, index) => (
        <Card className="gap-0 overflow-hidden py-0" key={index}>
          <CardHeader className="border-b px-5 py-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 px-5 py-5">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="col-span-2 space-y-2 border-t pt-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

type SuppliersErrorStateProps = {
  onRetry: () => void
}

function SuppliersErrorState({ onRetry }: SuppliersErrorStateProps) {
  const { t } = useTranslation('suppliers')

  return (
    <Card className="border-destructive/30 bg-destructive/[0.025] shadow-none">
      <CardContent className="flex flex-col items-center px-6 py-8 text-center sm:py-12">
        <div className="mb-5 grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </div>
        <h2 className="text-lg font-semibold">{t('error.title')}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {t('error.description')}
        </p>
        <Button className="mt-6" onClick={onRetry} type="button" variant="outline">
          <RefreshCw aria-hidden="true" className="size-4" />
          {t('error.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

function SuppliersEmptyState() {
  const { t } = useTranslation('suppliers')

  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center px-6 py-8 text-center sm:py-12">
        <div className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <PackageOpen aria-hidden="true" className="size-5" />
        </div>
        <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {t('empty.description')}
        </p>
      </CardContent>
    </Card>
  )
}

type SuppliersPopulatedStateProps = {
  suppliers: SupplierSummary[]
}

function SuppliersPopulatedState({
  suppliers,
}: SuppliersPopulatedStateProps) {
  const { t } = useTranslation('suppliers')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('populated.summary', { count: suppliers.length })}
        </p>
        <Badge variant="outline">{t('populated.syntheticBadge')}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    </div>
  )
}

export {
  SuppliersEmptyState,
  SuppliersErrorState,
  SuppliersLoadingState,
  SuppliersPopulatedState,
}
