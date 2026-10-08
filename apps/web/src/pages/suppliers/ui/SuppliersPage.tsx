export function SuppliersPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Catalog setup
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Suppliers</h1>
        <p className="max-w-2xl text-slate-600">
          Add a supplier and save its column mapping to make future price-list
          imports repeatable.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold">No suppliers yet</h2>
        <p className="mt-2 text-sm text-slate-500">
          Supplier onboarding will be implemented in the next product stage.
        </p>
      </div>
    </section>
  )
}
