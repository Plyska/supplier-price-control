import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createDatabase } from '@supplier-price-control/db'
import { createAuth, type LoginMail } from '../src/auth/auth.js'
import { provisionPilot } from '../src/auth/provision.js'
import { loadEnvironment } from '../src/config/env.js'
import { createApp } from '../src/app.js'

const url = process.env.TEST_DATABASE_URL
if (!url && process.argv.some((argument) => argument.endsWith('tests/suppliers.integration.test.ts'))) {
  throw new Error('TEST_DATABASE_URL is required for supplier integration tests')
}
if (url) {
  const parsed = new URL(url)
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) {
    throw new Error('Supplier integration tests require a local _test database')
  }
}

const database = url ? createDatabase({ connectionString: url, maxConnections: 5 }) : null
let fixtureNumber = 0
const runIpPrefix = randomUUID().slice(0, 4)
afterAll(async () => { await database?.$disconnect() })

describe.skipIf(!database)('supplier API with real PostgreSQL', () => {
  async function fixture() {
    const environment = loadEnvironment({
      DATABASE_URL: url,
      NODE_ENV: 'test',
      MAIL_FROM: 'login@example.test',
      SMTP_HOST: '127.0.0.1',
      TRUST_PROXY_HOPS: '1',
      WEB_ORIGIN: 'http://localhost:5173',
    })
    const mails: LoginMail[] = []
    const sendMail = async (mail: LoginMail) => { mails.push(mail) }
    const app = createApp({ identity: { auth: createAuth(database!, environment, sendMail), database: database!, environment } })
    const user = await provisionPilot(database!, {
      displayName: `Supplier user ${++fixtureNumber}`,
      email: `${randomUUID()}@example.test`,
    })
    const mutate = (method: 'post' | 'patch', path: string, cookie?: string) => request(app)[method](path)
      .set('Origin', environment.WEB_ORIGIN)
      .set('X-SPC-CSRF', '1')
      .set('X-Forwarded-For', `2001:db8:${runIpPrefix}:${fixtureNumber}::1`)
      .set(cookie ? { Cookie: cookie } : {})
    await mutate('post', '/api/v1/auth/login').send({ email: user.email })
    const token = new URLSearchParams(new URL(mails.at(-1)!.url).hash.slice(1)).get('token')!
    const verified = await mutate('post', '/api/v1/auth/verify').send({ token })
    const cookie = (verified.headers['set-cookie'] as unknown as string[])
      .map((value) => value.split(';')[0])
      .join('; ')
    const organizations = await request(app).get('/api/v1/organizations').set('Cookie', cookie)
    const organizationId = organizations.body.data[0].id as string
    const path = `/api/v1/organizations/${organizationId}/suppliers`
    return { app, cookie, environment, mutate, organizationId, path, user }
  }

  it('creates, searches, paginates, updates and archives suppliers with audit evidence', async () => {
    const owner = await fixture()
    const created = await owner.mutate('post', owner.path, owner.cookie).send({
      name: '  Alpha supply  ',
      notes: 'Synthetic note',
    })
    expect(created.status).toBe(201)
    expect(created.body.data).toMatchObject({
      archivedAt: null,
      name: 'Alpha supply',
      notes: 'Synthetic note',
      organizationId: owner.organizationId,
      priceListsCount: 0,
      productsCount: 0,
    })

    await owner.mutate('post', owner.path, owner.cookie).send({ name: 'Beta supply', notes: null })
    const firstPage = await request(owner.app)
      .get(`${owner.path}?page=1&pageSize=1&q=supply`)
      .set('Cookie', owner.cookie)
    expect(firstPage.status).toBe(200)
    expect(firstPage.body.data.pagination).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 })
    expect(firstPage.body.data.items).toHaveLength(1)

    const supplierPath = `${owner.path}/${created.body.data.id}`
    expect((await request(owner.app).get(supplierPath).set('Cookie', owner.cookie)).status).toBe(200)
    const updated = await owner.mutate('patch', supplierPath, owner.cookie).send({
      name: 'Alpha distribution',
      notes: null,
    })
    expect(updated.body.data).toMatchObject({ name: 'Alpha distribution', notes: null })

    const archived = await owner.mutate('post', `${supplierPath}/archive`, owner.cookie).send({})
    expect(archived.status).toBe(200)
    expect(archived.body.data.archivedAt).toEqual(expect.any(String))
    expect((await request(owner.app).get(owner.path).set('Cookie', owner.cookie)).body.data.pagination.total).toBe(1)
    expect((await request(owner.app).get(`${owner.path}?status=archived`).set('Cookie', owner.cookie)).body.data.pagination.total).toBe(1)
    expect((await owner.mutate('patch', supplierPath, owner.cookie).send({ name: 'Blocked', notes: null })).status).toBe(409)
    const restored = await owner.mutate('post', `${supplierPath}/restore`, owner.cookie).send({})
    expect(restored.body.data.archivedAt).toBeNull()
    expect((await request(owner.app).get(owner.path).set('Cookie', owner.cookie)).body.data.pagination.total).toBe(2)

    const actions = await database!.auditEvent.findMany({
      where: { entityId: created.body.data.id, organizationId: owner.organizationId },
      orderBy: { createdAt: 'asc' },
      select: { action: true, metadata: true, requestId: true },
    })
    expect(actions.map(({ action }) => action)).toEqual([
      'supplier.created',
      'supplier.updated',
      'supplier.archived',
      'supplier.restored',
    ])
    expect(actions.every(({ requestId }) => Boolean(requestId))).toBe(true)
    expect(JSON.stringify(actions)).not.toContain('Synthetic note')
  })

  it('enforces tenant isolation and viewer/editor permissions', async () => {
    const owner = await fixture()
    const outsider = await fixture()
    const created = await owner.mutate('post', owner.path, owner.cookie).send({
      name: 'Private supplier',
      notes: null,
    })
    const supplierId = created.body.data.id as string

    expect((await request(outsider.app)
      .get(`/api/v1/organizations/${owner.organizationId}/suppliers`)
      .set('Cookie', outsider.cookie)).status).toBe(404)
    expect((await request(outsider.app)
      .get(`${outsider.path}/${supplierId}`)
      .set('Cookie', outsider.cookie)).status).toBe(404)

    await database!.membership.create({
      data: { organizationId: owner.organizationId, role: 'viewer', userId: outsider.user.id },
    })
    const sharedPath = `/api/v1/organizations/${owner.organizationId}/suppliers`
    expect((await request(outsider.app).get(sharedPath).set('Cookie', outsider.cookie)).status).toBe(200)
    expect((await outsider.mutate('post', sharedPath, outsider.cookie).send({ name: 'Forbidden', notes: null })).status).toBe(403)

    await database!.membership.update({
      where: { organizationId_userId: { organizationId: owner.organizationId, userId: outsider.user.id } },
      data: { role: 'editor' },
    })
    expect((await outsider.mutate('post', sharedPath, outsider.cookie).send({ name: 'Editor supplier', notes: null })).status).toBe(201)
  })

  it('validates input and protects supplier mutations against CSRF', async () => {
    const owner = await fixture()
    expect((await owner.mutate('post', owner.path, owner.cookie).send({ name: '', notes: null })).status).toBe(400)
    expect((await request(owner.app)
      .post(owner.path)
      .set('Cookie', owner.cookie)
      .send({ name: 'Missing origin', notes: null })).status).toBe(403)
    expect((await request(owner.app)
      .get(`${owner.path}?page=0`)
      .set('Cookie', owner.cookie)).status).toBe(400)
  })
})
