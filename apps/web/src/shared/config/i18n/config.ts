import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'

export const supportedLanguages = ['uk', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

const fallbackLanguage: SupportedLanguage = 'uk'
const languageStorageKey = 'supplier-price-control-language'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: fallbackLanguage,
    defaultNS: 'common',
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: languageStorageKey,
    },
  })

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.split('-')[0] ?? fallbackLanguage
}

syncDocumentLanguage(i18n.resolvedLanguage ?? fallbackLanguage)
i18n.on('languageChanged', syncDocumentLanguage)
