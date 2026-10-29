import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { notifySessionChange } from '../../../entities/session'
import { apiClient } from '../../../shared/api/client'

export function useSignOut() {
  const [isPending, setPending] = useState(false)
  const [hasError, setHasError] = useState(false)
  const client = useQueryClient()
  const navigate = useNavigate()

  const signOut = async () => {
    setPending(true)
    setHasError(false)

    try {
      await apiClient.post('/auth/logout', {})
      await client.cancelQueries()
      client.clear()
      notifySessionChange()
      navigate('/login', { replace: true })
    } catch {
      setHasError(true)
    } finally {
      setPending(false)
    }
  }

  return { hasError, isPending, signOut }
}
