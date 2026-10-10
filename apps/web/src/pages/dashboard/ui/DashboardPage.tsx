import { useTranslation } from 'react-i18next'
import { StatCard } from '../../../shared/ui/stat-card'
import { ApiStatusCard } from './ApiStatusCard'

export function DashboardPage() {
  const { t } = useTranslation()
  const stats = [
    { label: t('dashboard.stats.suppliers'), value: '0' },
    { label: t('dashboard.stats.priceLists'), value: '0' },
    { label: t('dashboard.stats.itemsChanged'), value: '0' },
  ]

  return (
    <section className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          {t('dashboard.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('dashboard.title')}
        </h1>
        <p className="text-base leading-7 text-slate-600">
          {t('dashboard.description')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ApiStatusCard />
    </section>
  )
}
