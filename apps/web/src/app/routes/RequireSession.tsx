import { useEffect, useState, type PropsWithChildren } from 'react'
import { Navigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSession, sessionKey } from '../../entities/session'
import { Button } from '@/components/ui/button'

export function RequireSession({ children }: PropsWithChildren) {
  const session = useSession()
  const client = useQueryClient()
  const { t } = useTranslation('auth')
  const userId = session.data?.user.userId
  const [wasSignedIn, setWasSignedIn] = useState(Boolean(userId))
  if (userId && !wasSignedIn) setWasSignedIn(true)
  useEffect(() => {
    // Remove all caches from other identities, including responses already in flight.
    if (session.isSuccess) {
      const filters = { predicate: (q: { queryKey: readonly unknown[] }) => q.queryKey[0] !== sessionKey[0] && q.queryKey[1] !== userId }
      void client.cancelQueries(filters).then(() => client.removeQueries(filters))
    }
  }, [client, userId, session.isSuccess])
  if (session.isPending) return <p role="status">{t('loading')}</p>
  if (session.isError) return <div role="alert" className="space-y-4"><p>{t('unavailable')}</p><Button onClick={() => void session.refetch()}>{t('retry')}</Button></div>
  if (!session.data) return <Navigate to="/login" replace state={{ expired: wasSignedIn }} />
  return children
}
