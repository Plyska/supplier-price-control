import { ArrowRight, CircleAlert, FileSpreadsheet, Percent, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { formatDateOnly } from '@/shared/lib/date'
import { StatCard } from '@/shared/ui/stat-card'

// Static design fixtures only. Never used for API requests or price calculations.
const imports = [
  { file: 'demo-price-list-october.xlsx', date: '2026-10-29', rows: 1240, status: 'review' },
  { file: 'demo-price-list-september.xlsx', date: '2026-09-28', rows: 1216, status: 'exported' },
  { file: 'demo-price-list-august.csv', date: '2026-08-27', rows: 1198, status: 'approved' },
] as const

const changes = [
  { key: 'increased', count: 124 },
  { key: 'decreased', count: 38 },
  { key: 'newItems', count: 24 },
] as const

export function SupplierOverviewPreview() {
  const { t, i18n } = useTranslation('suppliers')
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'
  const number = new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'uk-UA')
  const stats = [
    { label: t('preview.products'), value: number.format(1240) },
    { label: t('preview.priceLists'), value: '3' },
    { label: t('preview.changed'), value: '186' },
    { label: t('preview.needsReview'), value: '23' },
  ]

  return (
    <section aria-label={t('preview.label')} className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed px-4 py-3">
        <Badge variant="secondary">{t('preview.label')}</Badge>
        <p className="min-w-0 flex-1 basis-64 text-sm text-muted-foreground">{t('preview.notice')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card className="gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">{t('details.imports')}</h2>
                <Button disabled type="button" size="sm" aria-describedby="supplier-demo-actions">
                  <Upload aria-hidden="true" className="size-4" />{t('preview.upload')}
                </Button>
              </div>
              <CardDescription>{t('preview.importsDescription')}</CardDescription>
            </CardHeader>
            <ul className="divide-y border-t">
              {imports.map((item) => (
                <li className="flex flex-wrap items-center gap-3 px-6 py-5" key={item.file}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileSpreadsheet aria-hidden="true" className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 basis-40 space-y-1">
                    <p className="break-all text-sm font-medium">{item.file}</p>
                    <p className="text-xs text-muted-foreground">
                      <time dateTime={item.date}>{formatDateOnly(item.date, language, 'compact')}</time>
                      {' · '}{t('preview.rows', { value: number.format(item.rows) })}
                    </p>
                  </div>
                  <Badge variant={item.status === 'review' ? 'secondary' : 'outline'}>{t(`preview.status.${item.status}`)}</Badge>
                </li>
              ))}
            </ul>
            <p className="border-t px-6 py-3 text-xs leading-5 text-muted-foreground">{t('preview.exportNote')}</p>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('preview.changesTitle')}</h2>
              <CardDescription>{t('preview.changesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                {changes.map(({ key, count }) => (
                  <div className="rounded-xl bg-muted/60 p-4" key={key}>
                    <dt className="text-sm text-muted-foreground">{t(`preview.${key}`)}</dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums">{count}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <h2 className="font-semibold">{t('preview.needsReview')}</h2>
                <Badge variant="secondary" className="ml-auto">23</Badge>
              </div>
              <CardDescription>{t('preview.reviewDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="space-y-3 text-sm">
                {([['matching', 14], ['packaging', 6], ['currency', 3]] as const).map(([key, count]) => (
                  <div className="flex items-start justify-between gap-3" key={key}>
                    <dt className="text-muted-foreground">{t(`preview.${key}`)}</dt>
                    <dd className="font-medium tabular-nums">{count}</dd>
                  </div>
                ))}
              </dl>
              <Button className="w-full" disabled variant="outline" type="button" aria-describedby="supplier-demo-actions">
                {t('preview.review')}<ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent aria-hidden="true" className="size-4 text-muted-foreground" />
                <h2 className="font-semibold">{t('preview.termsTitle')}</h2>
              </div>
              <CardDescription>{t('preview.termsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('preview.priceBasis')}</dt><dd className="text-right font-medium">{t('preview.basePrice')}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('preview.discount')}</dt><dd className="font-medium">15%</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('preview.currencyLabel')}</dt><dd className="font-medium">UAH</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t('preview.tax')}</dt><dd className="text-right font-medium">{t('preview.excludingVat')}</dd></div>
              </dl>
              <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">{t('preview.termsNote')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <p id="supplier-demo-actions" className="text-xs leading-5 text-muted-foreground">{t('preview.actionsNote')}</p>
    </section>
  )
}
