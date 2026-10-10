import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '../../../shared/ui/stat-card'

export function DashboardPage() {
  const { t } = useTranslation()
  const stats = [
    { label: t('dashboard.stats.suppliers'), value: '0' },
    { label: t('dashboard.stats.priceLists'), value: '0' },
    { label: t('dashboard.stats.itemsChanged'), value: '0' },
  ]

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <Badge variant="secondary">
          {t('dashboard.eyebrow')}
        </Badge>
        <h1 className="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
          {t('dashboard.title')}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {t('dashboard.description')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}
