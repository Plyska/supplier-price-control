import { useEffect, type PropsWithChildren } from 'react'
import { Link, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../entities/session'
import { useOrganization } from '../../entities/organization'
import { Button } from '@/components/ui/button'
import { isApiError } from '../../shared/api/client'

export function RequireOrganization({ children }: PropsWithChildren) {
  const session = useSession()
  const { organizationId = '' } = useParams()
  const userId = session.data?.user.userId ?? ''
  const organization = useOrganization(userId, organizationId)
  const client = useQueryClient()
  const { t } = useTranslation('auth')
  useEffect(() => {
    const filters = { predicate: (q: { queryKey: readonly unknown[] }) => q.queryKey.length >= 3 && q.queryKey[2] !== organizationId }
    void client.cancelQueries(filters).then(() => client.removeQueries(filters))
  }, [client, organizationId])
  if (organization.isPending) return <p role="status">{t('loading')}</p>
  if (organization.isError) {
    const status = isApiError(organization.error) ? organization.error.response?.status : undefined
    return <div role="alert" className="space-y-4"><p>{t(status === 403 || status === 404 ? 'forbidden' : 'unavailable')}</p>
      <Button onClick={() => void organization.refetch()}>{t('retry')}</Button><Link className="ml-4 underline" to="/?choose=1">{t('back')}</Link></div>
  }
  return <div key={`${userId}:${organizationId}`} className="space-y-6">
    <div className="flex flex-wrap items-center gap-4 border-b pb-4"><span className="font-medium">{organization.data.name}</span>
      <Link className="text-sm underline" to="/?choose=1">{t('organizations')}</Link>
      {organization.data.role === 'owner' && <Link className="text-sm underline" to={`/organizations/${organizationId}/settings`}>{t('settings')}</Link>}
    </div>{children}
  </div>
}
