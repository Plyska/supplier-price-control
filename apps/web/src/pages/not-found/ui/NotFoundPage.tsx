import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { routes } from '../../../shared/routes'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="px-8 py-6 text-center">
        <Badge variant="secondary">404</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
          {t('notFound.title')}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t('notFound.description')}
        </p>
        <Link
          className={cn(buttonVariants(), 'mt-6')}
          to={routes.dashboard}
        >
          {t('notFound.backToDashboard')}
        </Link>
      </CardContent>
    </Card>
  )
}
