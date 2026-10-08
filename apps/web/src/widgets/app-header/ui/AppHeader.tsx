import { NavLink } from 'react-router'
import { routes } from '../../../shared/routes'

const navigation = [
  { label: 'Dashboard', to: routes.dashboard, end: true },
  { label: 'Suppliers', to: routes.suppliers, end: false },
]

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <NavLink
          className="text-sm font-bold tracking-[0.16em] text-slate-950 uppercase"
          to={routes.dashboard}
        >
          Price Control
        </NavLink>

        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          {navigation.map(({ label, to, end }) => (
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
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
