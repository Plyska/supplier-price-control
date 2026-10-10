import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
        <Button
          aria-label={t('languageSwitcher.ariaLabel')}
          className="min-w-18 justify-around text-xs font-semibold"
          disabled={isLanguageChanging}
          size="sm"
          type="button"
          variant="outline"
        >
          {t(languages[currentLanguage].shortLabelKey)}
          <m.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            aria-hidden="true"
            className="inline-flex"
            transition={{ duration: 0.15 }}
          >
            <ChevronDown className="size-3.5" />
          </m.span>
        </Button>
      </DropdownMenu.Trigger>

      <AnimatePresence>
        {isOpen ? (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content align="end" asChild forceMount sideOffset={8}>
              <m.div
                animate="visible"
                className="z-50 min-w-44 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-overlay outline-none"
                exit="hidden"
                initial="hidden"
                style={{
                  transformOrigin:
                    'var(--radix-dropdown-menu-content-transform-origin)',
                }}
                variants={dropdownVariants}
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t('languageSwitcher.label')}
                </DropdownMenu.Label>
                <DropdownMenu.RadioGroup
                  onValueChange={changeLanguage}
                  value={currentLanguage}
                >
                  {supportedLanguages.map((language) => (
                    <DropdownMenu.RadioItem
                      className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pr-8 pl-2 text-sm text-foreground outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                      key={language}
                      value={language}
                    >
                      {t(languages[language].labelKey)}
                      <DropdownMenu.ItemIndicator className="absolute right-2 inline-flex size-4 items-center justify-center text-primary">
                        <Check aria-hidden="true" className="size-4" />
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
