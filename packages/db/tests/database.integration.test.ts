import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDatabase, type Prisma } from '../src/index.js'

const connectionString = process.env.TEST_DATABASE_URL
if (!connectionString) {
  throw new Error('TEST_DATABASE_URL is required; see packages/db/.env.example')
}
const testUrl = new URL(connectionString)
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(testUrl.hostname) ||
  !testUrl.pathname.endsWith('_test')
) {
  throw new Error('Integration tests require a local database with a name ending in _test')
}

const database = createDatabase({ connectionString, maxConnections: 2 })
const rollback = new Error('Rollback test fixtures')

// Every fixture is rolled back, including immutable audit events. No truncate,
// database reset, or destructive cleanup is needed between test runs.
async function withRollback(run: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await database.$transaction(async (tx) => {
      await run(tx)
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
}

async function createFixture(tx: Prisma.TransactionClient) {
  const organization = await tx.organization.create({ data: { name: 'Synthetic organization' } })
  const otherOrganization = await tx.organization.create({ data: { name: 'Other synthetic organization' } })
  const user = await tx.user.create({ data: { email: `${randomUUID()}@example.test` } })
  const membership = await tx.membership.create({
    data: { organizationId: organization.id, userId: user.id, role: 'owner' },
  })

  return { organization, otherOrganization, user, membership }
}

beforeAll(async () => { await database.$connect() })
afterAll(async () => { await database.$disconnect() })

describe('PostgreSQL identity foundation', () => {
  it('reads and writes organizations, memberships and tenant-scoped audit events', async () => {
    await withRollback(async (tx) => {
      const { organization, otherOrganization, user } = await createFixture(tx)
      const event = await tx.auditEvent.create({
        data: {
          organizationId: organization.id,
          actorUserId: user.id,
          action: 'organization.created',
          entityType: 'organization',
          entityId: organization.id,
          metadata: { source: 'synthetic-integration-test' },
        },
      })

      expect(organization.timeZone).toBeNull()
      expect(event.createdAt).toBeInstanceOf(Date)
      expect(await tx.auditEvent.count({ where: { organizationId: organization.id } })).toBe(1)
      expect(await tx.auditEvent.count({ where: { organizationId: otherOrganization.id } })).toBe(0)
      expect(await tx.membership.findUnique({
        where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
      })).toMatchObject({ role: 'owner', revokedAt: null })
    })
  })

  it('rejects duplicate memberships within an organization', async () => {
    await withRollback(async (tx) => {
      const { organization, user } = await createFixture(tx)
      await expect(tx.membership.create({
        data: { organizationId: organization.id, userId: user.id, role: 'viewer' },
      })).rejects.toMatchObject({ code: 'P2002' })
    })
  })

  it('allows membership in multiple organizations and defaults to viewer', async () => {
    await withRollback(async (tx) => {
      const { otherOrganization, user } = await createFixture(tx)
      const membership = await tx.membership.create({
        data: { organizationId: otherOrganization.id, userId: user.id },
      })
      expect(membership.role).toBe('viewer')
    })
  })

  it('rejects an audit actor who belongs only to another organization', async () => {
    await withRollback(async (tx) => {
      const { otherOrganization, user } = await createFixture(tx)
      await expect(tx.auditEvent.create({
        data: {
          organizationId: otherOrganization.id,
          actorUserId: user.id,
          action: 'organization.updated',
          entityType: 'organization',
        },
      })).rejects.toMatchObject({ code: 'P2003' })
    })
  })

  it('allows a system audit event without inventing a user', async () => {
    await withRollback(async (tx) => {
      const { organization } = await createFixture(tx)
      expect(await tx.auditEvent.create({
        data: { organizationId: organization.id, action: 'system.check', entityType: 'organization' },
      })).toMatchObject({ actorUserId: null })
    })
  })

  it('rejects duplicate normalized email addresses', async () => {
    await withRollback(async (tx) => {
      const { user } = await createFixture(tx)
      await expect(tx.user.create({ data: { email: user.email } })).rejects.toMatchObject({ code: 'P2002' })
    })
  })

  it('requires email addresses to be stored trimmed and lowercase', async () => {
    await withRollback(async (tx) => {
      await expect(tx.user.create({ data: { email: ' MixedCase@example.test ' } }))
        .rejects.toThrow()
    })
  })

  it.each(['update', 'delete'] as const)('prevents %s of audit history', async (operation) => {
    await withRollback(async (tx) => {
      const { organization } = await createFixture(tx)
      const event = await tx.auditEvent.create({
        data: { organizationId: organization.id, action: 'system.check', entityType: 'organization' },
      })
      const mutation = operation === 'update'
        ? tx.auditEvent.update({ where: { id: event.id }, data: { action: 'rewritten' } })
        : tx.auditEvent.delete({ where: { id: event.id } })
      await expect(mutation).rejects.toThrow('Audit events are append-only')
    })
  })

  it('preserves an audit actor when membership is revoked', async () => {
    await withRollback(async (tx) => {
      const { organization, user } = await createFixture(tx)
      const event = await tx.auditEvent.create({
        data: { organizationId: organization.id, actorUserId: user.id, action: 'member.revoked', entityType: 'membership' },
      })
      await tx.membership.update({
        where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
        data: { revokedAt: new Date() },
      })
      expect((await tx.auditEvent.findUniqueOrThrow({ where: { id: event.id }, include: { actor: true } })).actor?.revokedAt)
        .toBeInstanceOf(Date)
      await expect(tx.membership.delete({
        where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
      })).rejects.toMatchObject({ code: 'P2003' })
    })
  })

  it('rolls back partial writes after failure', async () => {
    const id = randomUUID()
    await expect(database.$transaction(async (tx) => {
      await tx.organization.create({ data: { id, name: 'Rollback fixture' } })
      throw new Error('Simulated failure')
    })).rejects.toThrow('Simulated failure')
    expect(await database.organization.findUnique({ where: { id } })).toBeNull()
  })

  it('uses a runtime role without schema creation or administrative privileges', async () => {
    const [role] = await database.$queryRaw<Array<{
      rolsuper: boolean
      rolcreatedb: boolean
      rolcreaterole: boolean
      can_create: boolean
      can_truncate_audit: boolean
    }>>`
      SELECT rolsuper, rolcreatedb, rolcreaterole,
        has_schema_privilege(current_user, 'app', 'CREATE') AS can_create,
        has_table_privilege(current_user, 'app.audit_events', 'TRUNCATE') AS can_truncate_audit
      FROM pg_roles WHERE rolname = current_user
    `
    expect(role).toEqual({ rolsuper: false, rolcreatedb: false, rolcreaterole: false, can_create: false, can_truncate_audit: false })
  })
})
