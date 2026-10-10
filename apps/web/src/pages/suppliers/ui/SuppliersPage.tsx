import { useTranslation } from 'react-i18next'
import { PackageOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function SuppliersPage() {
  const { t } = useTranslation('suppliers')

  return (
    <section className="space-y-6">
      <div className="max-w-3xl space-y-4">
        <Badge variant="secondary">
          {t('eyebrow')}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl leading-7 text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-center px-6 py-8 text-center sm:py-12">
          <div className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <PackageOpen aria-hidden="true" className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t('empty.description')}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
