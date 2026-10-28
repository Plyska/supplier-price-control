import { z } from 'zod'

const trimmedName = z.string().trim().min(1, 'required').max(200, 'tooLong')
const nullableNotes = z.string().trim().max(1000, 'tooLong').nullable()

export const supplierInputSchema = z.object({
  name: trimmedName,
  notes: nullableNotes,
}).strict()

export const supplierListQuerySchema = z.object({
  q: z.string().trim().max(200).default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  status: z.enum(['active', 'archived', 'all']).default('active'),
}).strict()

export const supplierSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  priceListsCount: z.number().int().nonnegative(),
  productsCount: z.number().int().nonnegative(),
  latestPriceListDate: z.iso.date().nullable(),
})

export const supplierListSchema = z.object({
  items: supplierSchema.array(),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export type Supplier = z.infer<typeof supplierSchema>
export type SupplierInput = z.infer<typeof supplierInputSchema>
export type SupplierList = z.infer<typeof supplierListSchema>
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>
