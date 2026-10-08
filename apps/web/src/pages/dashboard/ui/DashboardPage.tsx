import { StatCard } from '../../../shared/ui/stat-card'

const stats = [
  { label: 'Suppliers', value: '0' },
  { label: 'Price lists', value: '0' },
  { label: 'Items changed', value: '0' },
]

export function DashboardPage() {
  return (
    <section className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Supplier price control
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          See supplier price changes before they affect your margin.
        </h1>
        <p className="text-base leading-7 text-slate-600">
          Upload price lists, map supplier products, and review every important
          change from one workspace.
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
