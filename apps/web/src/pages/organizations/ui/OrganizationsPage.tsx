import { Navigate, Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../../entities/session'
import { useOrganizations, useOrganization } from '../../../entities/organization'
import { OrganizationForm } from '../../../features/manage-organization'
import { Button } from '@/components/ui/button'

export function OrganizationsPage() {
  const session = useSession()
  return session.data ? <OrganizationList userId={session.data.user.userId} /> : null
}

function OrganizationList({ userId }: { userId: string }) {
  const { t } = useTranslation('auth')
  const list = useOrganizations(userId)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  if (list.isPending) return <p role="status">{t('loading')}</p>
  if (list.isError) return <div role="alert"><p>{t('unavailable')}</p><Button onClick={() => void list.refetch()}>{t('retry')}</Button></div>
  if (list.data.length === 1 && !params.has('choose')) return <Navigate to={`/organizations/${list.data[0].id}`} replace />
  return <div className="space-y-8">
    <h1 className="text-2xl font-semibold">{t('choose')}</h1>
    {list.data.length === 0 ? <p>{t('noAccess')}</p> : <ul className="space-y-2">{list.data.map((org) => <li key={org.id}>
      <Link className="block rounded-lg border bg-card p-4 hover:bg-muted" to={`/organizations/${org.id}`}>{org.name}</Link>
    </li>)}</ul>}
    <section className="space-y-4"><h2 className="text-lg font-medium">{t('createOrganization')}</h2>
      <OrganizationForm userId={userId} onSaved={(org) => navigate(`/organizations/${org.id}`)} />
    </section>
  </div>
}

export function OrganizationSettingsPage() {
  const { organizationId = '' } = useParams()
  const session = useSession()
  const organization = useOrganization(session.data?.user.userId ?? '', organizationId)
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  if (!session.data || !organization.data) return null
  if (organization.data.role !== 'owner') return <p role="alert">{t('forbidden')}</p>
  return <section className="space-y-6"><h1 className="text-2xl font-semibold">{t('settings')}</h1>
    <OrganizationForm userId={session.data.user.userId} organization={organization.data} onSaved={() => navigate(`/organizations/${organizationId}`)} />
  </section>
}
