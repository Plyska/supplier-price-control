import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { LanguageSwitcher } from '../../../features/change-language'
import { cn } from '../../../shared/lib/utils'
import { routes } from '../../../shared/routes'

const navigation = [
  { labelKey: 'navigation.dashboard', to: routes.dashboard, end: true },
  { labelKey: 'navigation.suppliers', to: routes.suppliers, end: false },
] as const

export function AppHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/78">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-page py-3 sm:flex-nowrap sm:py-0">
        <NavLink
          className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-foreground uppercase focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          to={routes.dashboard}
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_14%,transparent)]"
          />
          {t('common.brand')}
        </NavLink>

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <nav
            aria-label={t('navigation.primaryAriaLabel')}
            className="flex items-center gap-1"
          >
            {navigation.map(({ labelKey, to, end }) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    buttonVariants({
                      size: 'sm',
                      variant: isActive ? 'default' : 'ghost',
                    }),
                    !isActive && 'text-muted-foreground',
                  )
                }
                end={end}
                key={to}
                to={to}
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
