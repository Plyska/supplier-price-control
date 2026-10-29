import { NavLink } from 'react-router'
import { useSession } from '../../../entities/session'
import { useSignOut } from '../../../features/sign-out'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../../features/change-language'
import { routes } from '../../../shared/routes'

export function AppHeader() {
  const { t } = useTranslation()
  const { t: authText } = useTranslation('auth')
  const session = useSession()
  const { hasError, isPending, signOut } = useSignOut()

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

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {session.data && <Button variant="ghost" size="sm" disabled={isPending} onClick={() => void signOut()}>{authText('logout')}</Button>}
          {hasError && <span role="alert" className="text-sm text-destructive">{authText('unavailable')}</span>}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
