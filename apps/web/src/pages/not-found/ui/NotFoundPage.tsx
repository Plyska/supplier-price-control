import { Link } from 'react-router'
import { routes } from '../../../shared/routes'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-slate-600">
        The page you requested does not exist.
      </p>
      <Link
        className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        to={routes.dashboard}
      >
        Back to dashboard
      </Link>
    </section>
  )
}
