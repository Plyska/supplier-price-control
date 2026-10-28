import { m } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router'
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
    {isLogin ? <PageTransition key={location.pathname}><LoginPage /></PageTransition> :
      <RequireSession><PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<OrganizationsPage />} />
          <Route path="/organizations/:organizationId" element={<RequireOrganization><DashboardPage /></RequireOrganization>} />
          <Route path="/organizations/:organizationId/suppliers" element={<RequireOrganization><SuppliersPage /></RequireOrganization>} />
          <Route path="/organizations/:organizationId/suppliers/:supplierId" element={<RequireOrganization><SupplierDetailsPage /></RequireOrganization>} />
          <Route path="/organizations/:organizationId/settings" element={<RequireOrganization><OrganizationSettingsPage /></RequireOrganization>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageTransition></RequireSession>}
  </m.div>
}
