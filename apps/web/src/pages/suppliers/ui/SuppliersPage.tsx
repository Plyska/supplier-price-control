import { useTranslation } from 'react-i18next'

export function SuppliersPage() {
  const { t } = useTranslation('suppliers')

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          {t('eyebrow')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-slate-600">
          {t('description')}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {t('empty.description')}
        </p>
      </div>
    </section>
  )
}
