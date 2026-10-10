import type { SupplierSummary } from '@/entities/supplier'

const syntheticSuppliers = [
  {
    id: 'fixture-nordline-trade',
    latestPriceListDate: '2026-10-01',
    name: 'Nordline Trade',
    priceListsCount: 4,
    productsCount: 1284,
  },
  {
    id: 'fixture-atlas-components',
    latestPriceListDate: '2026-09-24',
    name: 'Atlas Components',
    priceListsCount: 2,
    productsCount: 638,
  },
  {
    id: 'fixture-vertex-supply',
    latestPriceListDate: null,
    name: 'Vertex Supply',
    priceListsCount: 0,
    productsCount: 0,
  },
] satisfies SupplierSummary[]

export { syntheticSuppliers }
