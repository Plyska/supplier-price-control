import { useState, useEffect, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { apiClient, isApiError } from '../../shared/api/client'
import { sessionKey } from '../../entities/session'

export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({ defaultOptions: {
    queries: { retry: false, staleTime: 30_000, gcTime: 5 * 60_000 },
    mutations: { retry: false },
  } }))
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use((response) => response, (error: unknown) => {
      if (isApiError(error) && error.response?.status === 401 && error.config?.url !== '/session') {
        void client.cancelQueries().then(() => { client.clear(); client.setQueryData(sessionKey, null) })
      }
      return Promise.reject(error)
    })
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('spc-auth') : null
    if (channel) channel.onmessage = () => {
      // Another tab changed the shared cookie: discard all private UI and drafts.
      window.location.replace('/')
    }
    return () => { apiClient.interceptors.response.eject(interceptor); channel?.close() }
  }, [client])
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
