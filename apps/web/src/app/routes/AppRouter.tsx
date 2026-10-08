import { Route, Routes } from 'react-router'
import { DashboardPage } from '../../pages/dashboard'
import { NotFoundPage } from '../../pages/not-found'
import { SuppliersPage } from '../../pages/suppliers'
import { routes } from '../../shared/routes'

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.dashboard} element={<DashboardPage />} />
      <Route path={routes.suppliers} element={<SuppliersPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
