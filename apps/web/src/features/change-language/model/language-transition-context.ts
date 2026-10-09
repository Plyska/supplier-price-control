import { createContext } from 'react'
import type { SupportedLanguage } from '../../../shared/config/i18n'

export type LanguageTransitionContextValue = {
  completeLanguageExit: () => void
  isLanguageChanging: boolean
  isPageVisible: boolean
  requestLanguageChange: (language: SupportedLanguage) => void
}

export const LanguageTransitionContext =
  createContext<LanguageTransitionContextValue | null>(null)
