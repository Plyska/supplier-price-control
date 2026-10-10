import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { isApiError } from '../../shared/api'

type QueryProviderProps = {
  children: ReactNode
}

function shouldRetry(failureCount: number, error: unknown) {
  if (isApiError(error)) {
    const status = error.response?.status

    if (status !== undefined && status >= 400 && status < 500) {
      return false
    }
  }

  return failureCount < 1
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
      },
    },
  })
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
