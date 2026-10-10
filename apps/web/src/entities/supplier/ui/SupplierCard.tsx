import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { formatDateOnly } from '@/shared/lib/date'
import type { SupplierSummary } from '../model/types'

type SupplierCardProps = {
  supplier: SupplierSummary
}

function SupplierCard({ supplier }: SupplierCardProps) {
  const { i18n, t } = useTranslation('suppliers')
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'
  const numberFormatter = new Intl.NumberFormat(
    language === 'uk' ? 'uk-UA' : 'en-GB',
  )
  const latestPriceListDate = supplier.latestPriceListDate
    ? formatDateOnly(supplier.latestPriceListDate, language)
    : null

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <Building2 aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-base font-semibold leading-none">
              {supplier.name}
            </h2>
            <CardDescription>{t('card.subtitle')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 px-5 py-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('card.priceLists')}
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {numberFormatter.format(supplier.priceListsCount)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('card.products')}
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {numberFormatter.format(supplier.productsCount)}
          </p>
        </div>
        <div className="col-span-2 space-y-1 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            {t('card.latestPriceList')}
          </p>
          <p className="text-sm font-medium">
            {latestPriceListDate ?? t('card.noPriceList')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { SupplierCard }
