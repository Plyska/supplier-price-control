import type { SupplierInput, SupplierListQuery } from '@supplier-price-control/contracts'
import type { Prisma, PrismaClient } from '@supplier-price-control/db'
import { HttpError } from '../http/http-error.js'
import type { OrganizationContext } from '../organizations/access.js'

type SupplierRecord = {
  archivedAt: Date | null
  createdAt: Date
  id: string
  name: string
  notes: string | null
  organizationId: string
  updatedAt: Date
}

function toSupplierDto(supplier: SupplierRecord) {
  return {
    ...supplier,
    archivedAt: supplier.archivedAt?.toISOString() ?? null,
    createdAt: supplier.createdAt.toISOString(),
    latestPriceListDate: null,
    priceListsCount: 0,
    productsCount: 0,
    updatedAt: supplier.updatedAt.toISOString(),
  }
}

export async function listSuppliers(
  database: PrismaClient,
  context: OrganizationContext,
  query: SupplierListQuery,
) {
  const archivedAt = query.status === 'active'
    ? null
    : query.status === 'archived'
      ? { not: null }
      : undefined
  const where: Prisma.SupplierWhereInput = {
    organizationId: context.organizationId,
    ...(archivedAt !== undefined ? { archivedAt } : {}),
    ...(query.q ? {
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { notes: { contains: query.q, mode: 'insensitive' } },
      ],
    } : {}),
  }
  const [items, total] = await database.$transaction([
    database.supplier.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    database.supplier.count({ where }),
  ])

  return {
    items: items.map(toSupplierDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  }
}

export async function getSupplier(
  database: PrismaClient,
  context: OrganizationContext,
  supplierId: string,
) {
  const supplier = await database.supplier.findFirst({
    where: { id: supplierId, organizationId: context.organizationId },
  })
  if (!supplier) throw new HttpError(404, 'NOT_FOUND', 'Supplier not found')
  return toSupplierDto(supplier)
}

export async function createSupplier(
  database: PrismaClient,
  context: OrganizationContext,
  input: SupplierInput,
  requestId: string,
) {
  return database.$transaction(async (transaction) => {
    const supplier = await transaction.supplier.create({
      data: { ...input, organizationId: context.organizationId },
    })
    await writeAudit(transaction, context, supplier.id, 'supplier.created', requestId, ['name', 'notes'])
    return toSupplierDto(supplier)
  })
}

export async function updateSupplier(
  database: PrismaClient,
  context: OrganizationContext,
  supplierId: string,
  input: SupplierInput,
  requestId: string,
) {
  return database.$transaction(async (transaction) => {
    const result = await transaction.supplier.updateMany({
      where: { archivedAt: null, id: supplierId, organizationId: context.organizationId },
      data: input,
    })
    if (result.count !== 1) await throwSupplierMutationError(transaction, context, supplierId)
    const supplier = await transaction.supplier.findFirstOrThrow({
      where: { id: supplierId, organizationId: context.organizationId },
    })
    await writeAudit(transaction, context, supplier.id, 'supplier.updated', requestId, ['name', 'notes'])
    return toSupplierDto(supplier)
  })
}

export async function archiveSupplier(
  database: PrismaClient,
  context: OrganizationContext,
  supplierId: string,
  requestId: string,
) {
  return database.$transaction(async (transaction) => {
    const result = await transaction.supplier.updateMany({
      where: { archivedAt: null, id: supplierId, organizationId: context.organizationId },
      data: { archivedAt: new Date() },
    })
    const supplier = await transaction.supplier.findFirst({
      where: { id: supplierId, organizationId: context.organizationId },
    })
    if (!supplier) throw new HttpError(404, 'NOT_FOUND', 'Supplier not found')
    if (result.count === 1) {
      await writeAudit(transaction, context, supplier.id, 'supplier.archived', requestId, ['archivedAt'])
    }
    return toSupplierDto(supplier)
  })
}

export async function restoreSupplier(
  database: PrismaClient,
  context: OrganizationContext,
  supplierId: string,
  requestId: string,
) {
  return database.$transaction(async (transaction) => {
    const result = await transaction.supplier.updateMany({
      where: { archivedAt: { not: null }, id: supplierId, organizationId: context.organizationId },
      data: { archivedAt: null },
    })
    const supplier = await transaction.supplier.findFirst({
      where: { id: supplierId, organizationId: context.organizationId },
    })
    if (!supplier) throw new HttpError(404, 'NOT_FOUND', 'Supplier not found')
    if (result.count === 1) {
      await writeAudit(transaction, context, supplier.id, 'supplier.restored', requestId, ['archivedAt'])
    }
    return toSupplierDto(supplier)
  })
}

async function throwSupplierMutationError(
  transaction: Prisma.TransactionClient,
  context: OrganizationContext,
  supplierId: string,
): Promise<never> {
  const supplier = await transaction.supplier.findFirst({
    where: { id: supplierId, organizationId: context.organizationId },
    select: { archivedAt: true },
  })
  if (!supplier) throw new HttpError(404, 'NOT_FOUND', 'Supplier not found')
  throw new HttpError(409, 'RESOURCE_ARCHIVED', 'Archived supplier cannot be changed')
}

async function writeAudit(
  transaction: Prisma.TransactionClient,
  context: OrganizationContext,
  supplierId: string,
  action: string,
  requestId: string,
  changedFields: string[],
) {
  await transaction.auditEvent.create({
    data: {
      action,
      actorUserId: context.userId,
      entityId: supplierId,
      entityType: 'supplier',
      metadata: { changedFields },
      organizationId: context.organizationId,
      requestId,
    },
  })
}
