import { useEffect, type PropsWithChildren } from 'react'
import { Link, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '../../entities/session'
import { useOrganization } from '../../entities/organization'
import { Button, buttonVariants } from '@/components/ui/button'
import { isApiError } from '../../shared/api/client'
import { WorkspaceShell } from '../../widgets/app-sidebar'

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
      <div className="flex flex-wrap gap-3"><Button onClick={() => void organization.refetch()}>{t('retry')}</Button>
        <Link className={buttonVariants({ variant: 'outline' })} to="/"><ArrowLeft aria-hidden="true" className="size-4" />{t('back')}</Link></div></div>
  }
  return <WorkspaceShell key={`${userId}:${organizationId}`} organization={organization.data}>{children}</WorkspaceShell>
}
