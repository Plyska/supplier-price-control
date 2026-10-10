import { format, isValid, parse, type Locale } from 'date-fns'
import { enGB, uk as ukLocale } from 'date-fns/locale'
import type { SupportedLanguage } from '@/shared/config/i18n'

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
const dateOnlyStorageFormat = 'yyyy-MM-dd'
const dateReference = new Date(2000, 0, 1)

const locales = {
  en: enGB,
  uk: ukLocale,
} as const satisfies Record<SupportedLanguage, Locale>

type DateStyle = 'compact' | 'long'

const displayFormats = {
  compact: 'P',
  long: 'PPP',
} as const satisfies Record<DateStyle, string>

function parseDateOnly(value: string): Date | null {
  if (!dateOnlyPattern.test(value)) return null

  const parsedDate = parse(value, dateOnlyStorageFormat, dateReference)

  if (
    !isValid(parsedDate) ||
    format(parsedDate, dateOnlyStorageFormat) !== value
  ) {
    return null
  }

  return parsedDate
}

function formatDateOnly(
  value: string,
  language: SupportedLanguage,
  style: DateStyle = 'long',
): string | null {
  const date = parseDateOnly(value)

  if (!date) return null

  return format(date, displayFormats[style], {
    locale: locales[language],
  })
}

export { formatDateOnly, parseDateOnly }
