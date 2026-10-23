import type { Prisma, PrismaClient } from '@supplier-price-control/db'
import { HttpError } from '../http/http-error.js'

type Creation = { name: string; timeZone: string | null }

async function createInTransaction(tx: Prisma.TransactionClient, userId: string, key: string, data: Creation) {
  const previous = await tx.organizationCreation.findUnique({ where: { userId_key: { userId, key } } })
  if (previous) {
    if (previous.name !== data.name || previous.timeZone !== data.timeZone) {
      throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Creation key already used with different settings')
    }
    const membership = await tx.membership.findUnique({
      where: { organizationId_userId: { organizationId: previous.organizationId, userId } },
    })
    if (!membership || membership.revokedAt) throw new HttpError(404, 'NOT_FOUND', 'Organization not found')
    return tx.organization.findUniqueOrThrow({ where: { id: previous.organizationId } })
  }
  const organization = await tx.organization.create({
    data: { ...data, memberships: { create: { userId, role: 'owner' } } },
  })
  await tx.organizationCreation.create({ data: { userId, key, organizationId: organization.id, ...data } })
  await tx.auditEvent.create({
    data: { organizationId: organization.id, actorUserId: userId, action: 'organization.created', entityType: 'organization', entityId: organization.id },
  })
  return organization
}

export async function createOrganization(db: PrismaClient, userId: string, key: string, data: Creation) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app.users WHERE id = ${userId}::uuid FOR UPDATE`
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.emailVerified || user.disabledAt) throw new HttpError(401, 'SESSION_REQUIRED', 'Sign in required')
    return createInTransaction(tx, userId, key, data)
  })
}

export async function activateAccount(db: PrismaClient, userId: string) {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app.users WHERE id = ${userId}::uuid FOR UPDATE`
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.emailVerified || user.disabledAt) throw new HttpError(401, 'SESSION_REQUIRED', 'Sign in required')
    if (user.activatedAt) return
    // Existing fixture/provisioned memberships do not require another organization.
    if (await tx.membership.count({ where: { userId } }) === 0) {
      await createInTransaction(tx, userId, 'initial-activation', { name: 'My organization', timeZone: null })
    }
    await tx.user.update({ where: { id: userId }, data: { activatedAt: new Date() } })
  })
}
