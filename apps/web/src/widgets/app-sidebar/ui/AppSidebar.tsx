import { useEffect, useState, type PropsWithChildren } from 'react'
import { Link, NavLink } from 'react-router'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Building2,
  Check,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Truck,
  X,
} from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Organization } from '../../../entities/organization'
import { useOrganizations } from '../../../entities/organization'
import { useSession } from '../../../entities/session'
import { useSignOut } from '../../../features/sign-out'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  backdropVariants,
  dialogTransition,
  drawerVariants,
  dropdownVariants,
} from '@/shared/config/motion'
import { cn } from '@/shared/lib/utils'

type NavigationContentProps = {
  onNavigate?: () => void
  organization: Organization
  userId: string
}

const navigationItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    buttonVariants({ size: 'sm', variant: isActive ? 'secondary' : 'ghost' }),
    'w-full justify-start',
    !isActive && 'text-muted-foreground',
  )

function Brand({ onNavigate }: Pick<NavigationContentProps, 'onNavigate'>) {
  const { t } = useTranslation()
  return (
    <Link
      className="inline-flex items-center gap-2 px-2 text-sm font-bold tracking-[0.14em] text-foreground uppercase focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      onClick={onNavigate}
      to="/"
    >
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_14%,transparent)]"
      />
      {t('common.brand')}
    </Link>
  )
}

function OrganizationSwitcher({
  current,
  onNavigate,
  userId,
}: {
  current: Organization
  onNavigate?: () => void
  userId: string
}) {
  const { t } = useTranslation()
  const { t: authText } = useTranslation('auth')
  const organizations = useOrganizations(userId)
  const [isOpen, setOpen] = useState(false)

  return (
    <DropdownMenu.Root onOpenChange={setOpen} open={isOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          aria-label={t('navigation.switchOrganization')}
          className="w-full justify-between"
          size="sm"
          type="button"
          variant="outline"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="truncate">{current.name}</span>
          </span>
          <m.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </m.span>
        </Button>
      </DropdownMenu.Trigger>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content align="start" asChild forceMount sideOffset={8}>
              <m.div
                animate="visible"
                className="z-50 w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-overlay outline-none"
                exit="hidden"
                initial="hidden"
                style={{ transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)' }}
                variants={dropdownVariants}
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t('navigation.switchOrganization')}
                </DropdownMenu.Label>
                {organizations.isPending && (
                  <DropdownMenu.Item className="rounded-lg px-2 py-2 text-sm text-muted-foreground" disabled>
                    {t('navigation.loadingOrganizations')}
                  </DropdownMenu.Item>
                )}
                {organizations.isError && (
                  <DropdownMenu.Item
                    className="cursor-pointer rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent"
                    onSelect={(event) => {
                      event.preventDefault()
                      void organizations.refetch()
                    }}
                  >
                    {authText('retry')}
                  </DropdownMenu.Item>
                )}
                {organizations.data?.map((organization) => (
                  <DropdownMenu.Item asChild key={organization.id}>
                    <Link
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent"
                      onClick={onNavigate}
                      to={`/organizations/${organization.id}`}
                    >
                      <span className="truncate">{organization.name}</span>
                      {organization.id === current.id && <Check aria-label={t('navigation.currentOrganization')} className="size-4 shrink-0" />}
                    </Link>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item asChild>
                  <Link
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent"
                    onClick={onNavigate}
                    to="/"
                  >
                    <Building2 aria-hidden="true" className="size-4" />
                    {authText('organizations')}
                  </Link>
                </DropdownMenu.Item>
              </m.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  )
}

function AccountMenu({ onNavigate }: Pick<NavigationContentProps, 'onNavigate'>) {
  const { t } = useTranslation('auth')
  const session = useSession()
  const { hasError, isPending, signOut } = useSignOut()
  const [isOpen, setOpen] = useState(false)
  const email = session.data?.user.email ?? ''

  return (
    <div className="space-y-2">
      <DropdownMenu.Root onOpenChange={setOpen} open={isOpen}>
        <DropdownMenu.Trigger asChild>
          <Button className="w-full justify-start" size="sm" type="button" variant="ghost">
            <CircleUserRound aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="truncate">{email}</span>
            <ChevronDown aria-hidden="true" className={cn('ml-auto size-3.5 transition-transform', isOpen && 'rotate-180')} />
          </Button>
        </DropdownMenu.Trigger>
        <AnimatePresence>
          {isOpen && (
            <DropdownMenu.Portal forceMount>
              <DropdownMenu.Content align="start" asChild forceMount sideOffset={8}>
                <m.div
                  animate="visible"
                  className="z-50 min-w-56 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-overlay outline-none"
                  exit="hidden"
                  initial="hidden"
                  style={{ transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)' }}
                  variants={dropdownVariants}
                >
                  <DropdownMenu.Label className="truncate px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {email}
                  </DropdownMenu.Label>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent"
                    disabled={isPending}
                    onSelect={() => {
                      onNavigate?.()
                      void signOut()
                    }}
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {t('logout')}
                  </DropdownMenu.Item>
                </m.div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          )}
        </AnimatePresence>
      </DropdownMenu.Root>
      {hasError && <p className="px-2 text-sm text-destructive" role="alert">{t('unavailable')}</p>}
    </div>
  )
}

function NavigationContent({ onNavigate, organization, userId }: NavigationContentProps) {
  const { t } = useTranslation()
  const organizationUrl = `/organizations/${organization.id}`

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-4">
      <div className="space-y-6">
        <Brand onNavigate={onNavigate} />
        <OrganizationSwitcher current={organization} onNavigate={onNavigate} userId={userId} />
        <nav aria-label={t('navigation.primaryAriaLabel')} className="space-y-1">
          <NavLink className={navigationItemClass} end onClick={onNavigate} to={organizationUrl}>
            <LayoutDashboard aria-hidden="true" className="size-4" />
            {t('navigation.dashboard')}
          </NavLink>
          <NavLink className={navigationItemClass} onClick={onNavigate} to={`${organizationUrl}/suppliers`}>
            <Truck aria-hidden="true" className="size-4" />
            {t('navigation.suppliers')}
          </NavLink>
        </nav>
      </div>
      <div className="mt-auto space-y-1 border-t pt-4">
        {organization.role === 'owner' && (
          <NavLink className={navigationItemClass} onClick={onNavigate} to={`${organizationUrl}/settings`}>
            <Settings aria-hidden="true" className="size-4" />
            {t('navigation.settings')}
          </NavLink>
        )}
        <AccountMenu onNavigate={onNavigate} />
      </div>
    </div>
  )
}

function MobileBar({ onOpen, organization }: { onOpen: () => void; organization: Organization }) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b bg-background/92 px-page py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/78 lg:hidden">
      <Button aria-label={t('navigation.openMenu')} onClick={onOpen} size="icon" type="button" variant="outline">
        <Menu aria-hidden="true" className="size-4" />
      </Button>
      <span className="min-w-0 truncate text-sm font-medium">{organization.name}</span>
    </header>
  )
}

export function WorkspaceShell({ children, organization }: PropsWithChildren<{ organization: Organization }>) {
  const session = useSession()
  const { t } = useTranslation()
  const [isMobileOpen, setMobileOpen] = useState(false)
  const userId = session.data?.user.userId ?? ''

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setMobileOpen(false)
    }
    closeOnDesktop()
    desktopQuery.addEventListener('change', closeOnDesktop)
    return () => desktopQuery.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r bg-card lg:block">
        <NavigationContent organization={organization} userId={userId} />
      </aside>
      <Dialog.Root onOpenChange={setMobileOpen} open={isMobileOpen}>
        <MobileBar onOpen={() => setMobileOpen(true)} organization={organization} />
        <Dialog.Portal forceMount>
          <AnimatePresence initial={false}>
            {isMobileOpen && <>
              <Dialog.Overlay asChild forceMount>
                <m.div animate="visible" className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-sm lg:hidden" exit="hidden" initial="hidden" variants={backdropVariants} />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <m.aside animate="visible" className="fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] border-r bg-card shadow-overlay focus:outline-none lg:hidden" exit="hidden" initial="hidden" transition={dialogTransition} variants={drawerVariants}>
                  <Dialog.Title className="sr-only">{t('navigation.mobileNavigation')}</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button aria-label={t('navigation.closeMenu')} className="absolute top-4 right-4 z-10" size="icon-sm" variant="ghost">
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </Dialog.Close>
                  <NavigationContent onNavigate={() => setMobileOpen(false)} organization={organization} userId={userId} />
                </m.aside>
              </Dialog.Content>
            </>}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="min-w-0 flex-1 lg:ml-60">
        <main className="min-w-0 px-page py-8 sm:py-10 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
