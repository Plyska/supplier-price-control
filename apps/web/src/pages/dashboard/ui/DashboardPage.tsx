import { ArrowDownRight, ArrowRight, ArrowUpRight, Building2, CircleAlert, FileSpreadsheet, Plus, Upload } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { StatCard } from '../../../shared/ui/stat-card'

// Synthetic preview only: these records do not represent API resources.
const recentPriceLists = [
  { supplier: 'Demo Supply', file: 'demo-supply-october.xlsx', rows: 1240, status: 'review', date: '2026-10-29' },
  { supplier: 'Demo Components', file: 'demo-components.csv', rows: 860, status: 'calculated', date: '2026-10-28' },
  { supplier: 'Demo Distribution', file: 'demo-distribution.xlsx', rows: 2150, status: 'approved', date: '2026-10-27' },
] as const

const reviewItems = [
  { key: 'matching', count: 14 },
  { key: 'packaging', count: 6 },
  { key: 'currency', count: 3 },
] as const

const priceChanges = [
  { key: 'increased', count: 124, icon: ArrowUpRight },
  { key: 'decreased', count: 38, icon: ArrowDownRight },
  { key: 'newItems', count: 24, icon: Plus },
] as const

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { organizationId = '' } = useParams()
  const number = new Intl.NumberFormat(i18n.resolvedLanguage === 'en' ? 'en-GB' : 'uk-UA')
  const stats = [
    { label: t('dashboard.stats.suppliers'), value: '12' },
    { label: t('dashboard.stats.priceLists'), value: '4' },
    { label: t('dashboard.stats.itemsChanged'), value: '186' },
    { label: t('dashboard.preview.needsReview'), value: '23' },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{t('navigation.dashboard')}</h1>
          <p className="max-w-2xl text-muted-foreground">{t('dashboard.preview.description')}</p>
        </div>
        <Button disabled type="button"><Upload aria-hidden="true" className="size-4" />{t('dashboard.preview.upload')}</Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed px-4 py-3 text-sm">
        <Badge variant="secondary">{t('dashboard.preview.badge')}</Badge>
        <p className="min-w-0 text-muted-foreground">{t('dashboard.preview.notice')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card className="gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-5">
              <h2 className="font-semibold">{t('dashboard.preview.recentTitle')}</h2>
              <CardDescription>{t('dashboard.preview.recentDescription')}</CardDescription>
            </CardHeader>
            <ul className="divide-y border-t">
              {recentPriceLists.map((list) => (
                <li className="flex flex-wrap items-center gap-3 px-6 py-4" key={list.file}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileSpreadsheet aria-hidden="true" className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 basis-36 space-y-1">
                    <p className="text-sm font-medium">{list.supplier}</p>
                    <p className="break-all text-xs text-muted-foreground">{list.file}</p>
                    <p className="text-xs text-muted-foreground">
                      <time dateTime={list.date}>{list.date.split('-').reverse().join('.')}</time>
                      {' · '}{t('dashboard.preview.rows', { value: number.format(list.rows) })}
                    </p>
                  </div>
                  <Badge variant={list.status === 'review' ? 'secondary' : 'outline'}>
                    {t(`dashboard.preview.status.${list.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('dashboard.preview.changesTitle')}</h2>
              <CardDescription>{t('dashboard.preview.changesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {priceChanges.map(({ key, count, icon: Icon }) => (
                <div className="rounded-xl border p-4" key={key}>
                  <Icon aria-hidden="true" className="mb-3 size-4 text-muted-foreground" />
                  <p className="text-2xl font-semibold tabular-nums">{count}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`dashboard.preview.${key}`)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleAlert aria-hidden="true" className="size-4 text-muted-foreground" />
                <h2 className="font-semibold">{t('dashboard.preview.needsReview')}</h2>
                <Badge className="ml-auto" variant="secondary">23</Badge>
              </div>
              <CardDescription>{t('dashboard.preview.reviewDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="divide-y">
                {reviewItems.map(({ key, count }) => (
                  <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0" key={key}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t(`dashboard.preview.issues.${key}.title`)}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{t(`dashboard.preview.issues.${key}.description`)}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" disabled type="button" variant="outline">
                {t('dashboard.preview.review')}<ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('dashboard.preview.quickActions')}</h2>
              <CardDescription>{t('dashboard.preview.actionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link className={buttonVariants({ variant: 'outline', className: 'w-full justify-start' })} to={`/organizations/${organizationId}/suppliers`}>
                <Building2 aria-hidden="true" className="size-4" />{t('dashboard.preview.manageSuppliers')}
                <ArrowRight aria-hidden="true" className="ml-auto size-4" />
              </Link>
              <Button className="w-full justify-start" disabled type="button" variant="outline">
                <Upload aria-hidden="true" className="size-4" />{t('dashboard.preview.upload')}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">{t('dashboard.preview.comingSoon')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
