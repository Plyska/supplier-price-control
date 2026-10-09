import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useTranslation } from 'react-i18next'
import type { SupportedLanguage } from '../../../shared/config/i18n'
import {
  LanguageTransitionContext,
  type LanguageTransitionContextValue,
} from './language-transition-context'

export function LanguageTransitionProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation()
  const [pendingLanguage, setPendingLanguage] =
    useState<SupportedLanguage | null>(null)
  const [isPageVisible, setIsPageVisible] = useState(true)

  const requestLanguageChange = useCallback(
    (language: SupportedLanguage) => {
      const currentLanguage = i18n.resolvedLanguage ?? i18n.language

      if (currentLanguage.startsWith(language) || pendingLanguage) return

      setPendingLanguage(language)
      setIsPageVisible(false)
    },
    [i18n, pendingLanguage],
  )

  const completeLanguageExit = useCallback(() => {
    if (!pendingLanguage) return

    const language = pendingLanguage
    const finishTransition = () => {
      setPendingLanguage(null)
      setIsPageVisible(true)
    }

    void i18n.changeLanguage(language).then(finishTransition, finishTransition)
  }, [i18n, pendingLanguage])

  const value = useMemo<LanguageTransitionContextValue>(
    () => ({
      completeLanguageExit,
      isLanguageChanging: pendingLanguage !== null,
      isPageVisible,
      requestLanguageChange,
    }),
    [completeLanguageExit, isPageVisible, pendingLanguage, requestLanguageChange],
  )

  return (
    <LanguageTransitionContext value={value}>
      {children}
    </LanguageTransitionContext>
  )
}
