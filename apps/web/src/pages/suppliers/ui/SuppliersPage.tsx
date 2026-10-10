import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { syntheticSuppliers } from '../model/synthetic-suppliers'
import {
  SuppliersEmptyState,
  SuppliersErrorState,
  SuppliersLoadingState,
  SuppliersPopulatedState,
} from './SuppliersStates'

const previewStates = ['error', 'loading', 'populated'] as const
type PreviewState = (typeof previewStates)[number]

function isPreviewState(value: string | null): value is PreviewState {
  return previewStates.some((state) => state === value)
}

export function SuppliersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation('suppliers')
  const previewParam = searchParams.get('preview')
  const previewState =
    import.meta.env.DEV && isPreviewState(previewParam) ? previewParam : null

  const retryPreview = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('preview', 'populated')
    setSearchParams(nextSearchParams, { replace: true })
  }

  let content = <SuppliersEmptyState />

  if (previewState === 'loading') {
    content = <SuppliersLoadingState />
  }

  if (previewState === 'error') {
    content = <SuppliersErrorState onRetry={retryPreview} />
  }

  if (previewState === 'populated') {
    content = <SuppliersPopulatedState suppliers={syntheticSuppliers} />
  }

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

      {content}
    </section>
  )
}
