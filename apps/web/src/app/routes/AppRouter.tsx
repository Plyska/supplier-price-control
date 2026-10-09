import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router'
import { useLanguageTransition } from '../../features/change-language'
import { DashboardPage } from '../../pages/dashboard'
import { NotFoundPage } from '../../pages/not-found'
import { SuppliersPage } from '../../pages/suppliers'
import { routes } from '../../shared/routes'
import { PageTransition } from '../../shared/ui/page-transition'

export function AppRouter() {
  const location = useLocation()
  const { completeLanguageExit, isPageVisible } = useLanguageTransition()

  return (
    <AnimatePresence
      initial={false}
      mode="wait"
      onExitComplete={completeLanguageExit}
    >
      {isPageVisible ? (
        <Routes key={location.pathname} location={location}>
          <Route
            path={routes.dashboard}
            element={
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            }
          />
          <Route
            path={routes.suppliers}
            element={
              <PageTransition>
                <SuppliersPage />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      ) : null}
    </AnimatePresence>
  )
}
