import { use } from 'react'
import { LanguageTransitionContext } from './language-transition-context'

export function useLanguageTransition() {
  const context = use(LanguageTransitionContext)

  if (!context) {
    throw new Error(
      'useLanguageTransition must be used within LanguageTransitionProvider',
    )
  }

  return context
}
