import { m } from 'motion/react'
import { Outlet, Route, Routes, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useLanguageTransition } from '../../features/change-language'
import { DashboardPage } from '../../pages/dashboard'
import { NotFoundPage } from '../../pages/not-found'
import { SupplierDetailsPage, SuppliersPage } from '../../pages/suppliers'
import { pageVariants } from '../../shared/config/motion'
import { OrganizationsPage, OrganizationSettingsPage } from '../../pages/organizations'
import { PageTransition } from '../../shared/ui/page-transition'
import { LoginPage } from '../../pages/login'
import { RequireSession } from './RequireSession'
import { RequireOrganization } from './RequireOrganization'

export function AppRouter() {
  const location = useLocation()
  const { completeLanguageExit, isPageVisible } = useLanguageTransition()

  const isLogin = location.pathname === '/login' || location.pathname === '/login/verify'
  // Keep form state mounted during exit -> locale change -> enter.
  // Account/tenant navigation discards private content immediately.
  return <m.div variants={pageVariants} initial={false} animate={isPageVisible ? 'animate' : 'exit'}
    onAnimationComplete={(definition) => { if (definition === 'exit') completeLanguageExit() }}>
    {isLogin ? <TransitionedPage><LoginPage /></TransitionedPage> :
      <RequireSession>
        <Routes location={location}>
          <Route path="/" element={<TransitionedPage><OrganizationsPage /></TransitionedPage>} />
          <Route path="/organizations/:organizationId" element={<RequireOrganization><WorkspacePage /></RequireOrganization>}>
            <Route index element={<DashboardPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="suppliers/:supplierId" element={<SupplierDetailsPage />} />
            <Route path="settings" element={<OrganizationSettingsPage />} />
          </Route>
          <Route path="*" element={<TransitionedPage><NotFoundPage /></TransitionedPage>} />
        </Routes>
      </RequireSession>}
  </m.div>
}

function TransitionedPage({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <PageTransition key={location.pathname}>{children}</PageTransition>
}

function WorkspacePage() {
  return <TransitionedPage><Outlet /></TransitionedPage>
}
