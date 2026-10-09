import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { routes } from '../../../shared/routes'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 text-slate-600">{t('notFound.description')}</p>
      <Link
        className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        to={routes.dashboard}
      >
        {t('notFound.backToDashboard')}
      </Link>
    </section>
  )
}
