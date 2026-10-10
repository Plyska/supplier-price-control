import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApiHealth, healthQueryKey } from '../../../shared/api'

export function ApiStatusCard() {
  const { t } = useTranslation()
  const { data, isError, isFetching, isPending, refetch } = useQuery({
    queryFn: ({ signal }) => getApiHealth(signal),
    queryKey: healthQueryKey,
  })

  const isOnline = data?.data.status === 'ok'
  const statusLabel = isPending
    ? t('dashboard.apiStatus.loading')
    : isError
      ? t('dashboard.apiStatus.error')
      : t('dashboard.apiStatus.online')

  return (
    <article
      aria-live="polite"
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      role={isError ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
            isPending
              ? 'animate-pulse bg-slate-400'
              : isOnline
                ? 'bg-emerald-500'
                : 'bg-rose-500'
          }`}
        />
        <div>
          <h2 className="font-semibold text-slate-950">
            {t('dashboard.apiStatus.title')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {statusLabel}
          </p>
        </div>
      </div>

      {isError ? (
        <button
          className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          disabled={isFetching}
          onClick={() => void refetch()}
          type="button"
        >
          {isFetching
            ? t('dashboard.apiStatus.retrying')
            : t('dashboard.apiStatus.retry')}
        </button>
      ) : null}
    </article>
  )
}
