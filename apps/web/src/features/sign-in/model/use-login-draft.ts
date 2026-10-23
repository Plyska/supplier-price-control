import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

export type Draft = { email: string; sent: boolean; token: string | null }
export const LoginDraftContext = createContext<{ draft: Draft; setDraft: Dispatch<SetStateAction<Draft>> } | null>(null)

export function useLoginDraft() {
  const context = useContext(LoginDraftContext)
  if (!context) throw new Error('LoginDraftProvider is required')
  return context
}
