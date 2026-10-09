import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  supportedLanguages,
  type SupportedLanguage,
} from '../../../shared/config/i18n'
import { dropdownVariants } from '../../../shared/config/motion'
import { useLanguageTransition } from '../model/useLanguageTransition'

const languages = {
  uk: {
    labelKey: 'languageSwitcher.ukrainian',
    shortLabelKey: 'languageSwitcher.ukrainianShort',
  },
  en: {
    labelKey: 'languageSwitcher.english',
    shortLabelKey: 'languageSwitcher.englishShort',
  },
} as const satisfies Record<
  SupportedLanguage,
  { labelKey: string; shortLabelKey: string }
>

function isSupportedLanguage(language: string): language is SupportedLanguage {
  return supportedLanguages.some(
    (supportedLanguage) => supportedLanguage === language,
  )
}

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { i18n, t } = useTranslation()
  const { isLanguageChanging, requestLanguageChange } =
    useLanguageTransition()
  const currentLanguage =
    supportedLanguages.find((language) =>
      i18n.resolvedLanguage?.startsWith(language),
    ) ?? 'uk'

  const changeLanguage = (language: string) => {
    if (!isSupportedLanguage(language)) return

    setIsOpen(false)
    requestLanguageChange(language)
  }

  return (
    <DropdownMenu.Root onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('languageSwitcher.ariaLabel')}
          className="flex min-w-18 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"
          disabled={isLanguageChanging}
          type="button"
        >
          {t(languages[currentLanguage].shortLabelKey)}
          <m.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            aria-hidden="true"
            className="size-3.5"
            fill="none"
            transition={{ duration: 0.15 }}
            viewBox="0 0 16 16"
          >
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </m.svg>
        </button>
      </DropdownMenu.Trigger>

      <AnimatePresence>
        {isOpen ? (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content align="end" asChild forceMount sideOffset={8}>
              <m.div
                animate="visible"
                className="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg outline-none"
                exit="hidden"
                initial="hidden"
                style={{
                  transformOrigin:
                    'var(--radix-dropdown-menu-content-transform-origin)',
                }}
                variants={dropdownVariants}
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-slate-500">
                  {t('languageSwitcher.label')}
                </DropdownMenu.Label>
                <DropdownMenu.RadioGroup
                  onValueChange={changeLanguage}
                  value={currentLanguage}
                >
                  {supportedLanguages.map((language) => (
                    <DropdownMenu.RadioItem
                      className="relative flex cursor-default select-none items-center rounded-lg py-2 pr-8 pl-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950"
                      key={language}
                      value={language}
                    >
                      {t(languages[language].labelKey)}
                      <DropdownMenu.ItemIndicator className="absolute right-2 inline-flex size-4 items-center justify-center text-indigo-600">
                        <svg
                          aria-hidden="true"
                          fill="none"
                          viewBox="0 0 16 16"
                        >
                          <path
                            d="m3.5 8 3 3 6-6"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.75"
                          />
                        </svg>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </m.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        ) : null}
      </AnimatePresence>
    </DropdownMenu.Root>
  )
}
