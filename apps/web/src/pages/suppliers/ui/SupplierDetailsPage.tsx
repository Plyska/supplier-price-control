import { ArrowLeft, FileSpreadsheet, Percent } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganization } from '@/entities/organization'
import { useSession } from '@/entities/session'
import { SupplierCard, useSupplier } from '@/entities/supplier'
import { SupplierForm, SupplierStatusAction } from '@/features/manage-supplier'
import { isApiError } from '@/shared/api/client'

export function SupplierDetailsPage() {
  const [saved, setSaved] = useState(false)
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
          <Link className={buttonVariants({ variant: 'link' })} to={listHref}>{t('details.back')}</Link>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm underline" to={listHref}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('details.back')}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Badge variant="secondary">{t('details.eyebrow')}</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">{supplier.data.name}</h1>
          <p className="max-w-2xl text-muted-foreground">
            {supplier.data.notes || t('details.noNotes')}
          </p>
        </div>
        {canWrite && (
          <SupplierStatusAction
            organizationId={organizationId}
            supplier={supplier.data}
            userId={userId}
          />
        )}
      </div>
      {saved && <p className="text-sm" role="status">{t('form.result.success')}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('details.profile')}</CardTitle>
            <CardDescription>
              {supplier.data.archivedAt ? t('details.archivedDescription') : t('details.profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canWrite && !supplier.data.archivedAt
              ? <SupplierForm
                  key={supplier.data.updatedAt}
                  onSaved={() => setSaved(true)}
                  organizationId={organizationId}
                  supplier={supplier.data}
                  userId={userId}
                />
              : <SupplierCard supplier={supplier.data} />}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-4" />{t('details.imports')}</CardTitle>
              <CardDescription>{t('details.importsDescription')}</CardDescription>
            </CardHeader>
            <CardContent><Button disabled variant="outline">{t('details.nextStage')}</Button></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Percent className="size-4" />{t('details.rules')}</CardTitle>
              <CardDescription>{t('details.rulesDescription')}</CardDescription>
            </CardHeader>
            <CardContent><Button disabled variant="outline">{t('details.nextStage')}</Button></CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
