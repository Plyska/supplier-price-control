import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../../features/change-language'
import { routes } from '../../../shared/routes'

const navigation = [
  { labelKey: 'navigation.dashboard', to: routes.dashboard, end: true },
  { labelKey: 'navigation.suppliers', to: routes.suppliers, end: false },
] as const

export function AppHeader() {
  const { t } = useTranslation()

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3 sm:flex-nowrap sm:py-0">
        <NavLink
          className="text-sm font-bold tracking-[0.16em] text-slate-950 uppercase"
          to={routes.dashboard}
        >
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
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
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
