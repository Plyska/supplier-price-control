import type { SupplierSummary } from '@/entities/supplier'

const syntheticSuppliers = [
  {
    archivedAt: null,
    createdAt: '2026-09-01T08:00:00.000Z',
    id: 'fixture-nordline-trade',
    latestPriceListDate: '2026-10-01',
    name: 'Nordline Trade',
    notes: null,
    organizationId: 'fixture-organization',
    priceListsCount: 4,
    productsCount: 1284,
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    archivedAt: null,
    createdAt: '2026-09-02T08:00:00.000Z',
    id: 'fixture-atlas-components',
    latestPriceListDate: '2026-09-24',
    name: 'Atlas Components',
    notes: null,
    organizationId: 'fixture-organization',
    priceListsCount: 2,
    productsCount: 638,
    updatedAt: '2026-09-24T08:00:00.000Z',
  },
  {
    archivedAt: null,
    createdAt: '2026-09-03T08:00:00.000Z',
    id: 'fixture-vertex-supply',
    latestPriceListDate: null,
    name: 'Vertex Supply',
    notes: null,
    organizationId: 'fixture-organization',
    priceListsCount: 0,
    productsCount: 0,
    updatedAt: '2026-09-03T08:00:00.000Z',
  },
] satisfies SupplierSummary[]

export { syntheticSuppliers }
