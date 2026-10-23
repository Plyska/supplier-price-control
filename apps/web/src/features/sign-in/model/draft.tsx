import { useState, useEffect, type PropsWithChildren } from 'react'
import { LoginDraftContext, type Draft } from './use-login-draft'

export function LoginDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<Draft>(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = window.location.pathname === '/login/verify' ? params.get('token') : null
    return { email: '', sent: false, token }
  })
  useEffect(() => {
    if (draft.token) window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [draft.token])
  return <LoginDraftContext value={{ draft, setDraft }}>{children}</LoginDraftContext>
}
