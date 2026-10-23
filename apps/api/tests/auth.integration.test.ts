import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { createDatabase } from '@supplier-price-control/db'
import { createAuth, type LoginMail } from '../src/auth/auth.js'
import { provisionPilot } from '../src/auth/provision.js'
import { loadEnvironment } from '../src/config/env.js'
import { createApp } from '../src/app.js'
import { activateAccount } from '../src/organizations/service.js'

const url = process.env.TEST_DATABASE_URL
if (!url && process.argv.some((arg) => arg.endsWith('tests/auth.integration.test.ts'))) {
  throw new Error('TEST_DATABASE_URL is required for auth:test')
}
if (url) {
  const parsed = new URL(url)
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) {
    throw new Error('Auth integration tests require a local _test database')
  }
}
const db = url ? createDatabase({ connectionString: url, maxConnections: 5 }) : null
let fixtureNumber = 0
const runIpPrefix = randomUUID().slice(0, 4)
afterAll(async () => { await db?.$disconnect() })
afterEach(() => { vi.restoreAllMocks() })

describe.skipIf(!db)('Better Auth with real PostgreSQL', () => {
  async function fixture(production = false) {
    const environment = loadEnvironment({
      DATABASE_URL: url,
      AUTH_SECRET: 'synthetic-integration-test-secret-1234567890',
      NODE_ENV: production ? 'production' : 'test',
      WEB_ORIGIN: production ? 'https://app.example.test' : 'http://localhost:5173',
      SMTP_HOST: '127.0.0.1', MAIL_FROM: 'login@example.test',
      TRUST_PROXY_HOPS: '1',
    })
    const ip = `2001:db8:${runIpPrefix}:${++fixtureNumber}::1`
    const mails: LoginMail[] = []
    const send = vi.fn(async (mail: LoginMail) => { mails.push(mail) })
    const auth = createAuth(db!, environment, send)
    const makeApp = () => createApp({ identity: { auth: createAuth(db!, environment, send), database: db!, environment } })
    const app = createApp({ identity: { auth, database: db!, environment } })
    const user = await provisionPilot(db!, { email: `${randomUUID()}@example.test`, displayName: 'Synthetic pilot' })
    const post = (path: string) => request(app).post(`/api/v1${path}`).set('Origin', environment.WEB_ORIGIN).set('X-SPC-CSRF', '1').set('X-Forwarded-For', ip)
    const requestLink = async () => {
      expect((await post('/auth/login').send({ email: user.email })).status).toBe(202)
      return new URLSearchParams(new URL(mails.at(-1)!.url).hash.slice(1)).get('token')!
    }
    const verify = async (token: string) => post('/auth/verify').send({ token })
    const login = async () => {
      const response = await verify(await requestLink())
      expect(response.status, JSON.stringify(response.body)).toBe(204)
      return (response.headers['set-cookie'] as unknown as string[]).map((v) => v.split(';')[0]).join('; ')
    }
    return { app, makeApp, user, post, requestLink, verify, login, environment, mails, send }
  }

  it('verifies identity, provisions exactly one organization, persists across app restarts and never returns credentials', async () => {
    const f = await fixture()
    expect(f.user.emailVerified).toBe(false)
    const cookie = await f.login()
    const response = await request(f.makeApp()).get('/api/v1/session').set('Cookie', cookie)
    expect(response.status).toBe(200)
    expect(response.body.data.user.userId).toBe(f.user.id)
    expect(JSON.stringify(response.body)).not.toMatch(/token|sessionId|secret/)
    expect(response.headers['cache-control']).toContain('no-store')
    const account = await db!.user.findUniqueOrThrow({ where: { id: f.user.id } })
    expect(account.emailVerified).toBe(true)
    await Promise.all([activateAccount(db!, f.user.id), activateAccount(db!, f.user.id)])
    expect(await db!.membership.count({ where: { userId: f.user.id } })).toBe(1)
    const headers = await f.verify(await f.requestLink())
    expect(String(headers.headers['set-cookie'])).toMatch(/HttpOnly/)
    expect(String(headers.headers['set-cookie'])).toMatch(/SameSite=Lax/)
    expect(await db!.membership.count({ where: { userId: f.user.id } })).toBe(1)
  })

  it('consumes a hashed magic link once even under concurrent verification', async () => {
    const f = await fixture()
    const token = await f.requestLink()
    expect(await db!.verification.count({ where: { identifier: { contains: token } } })).toBe(0)
    const results = await Promise.all([f.verify(token), f.verify(token)])
    expect(results.map((r) => r.status).sort()).toEqual([204, 400])
    expect((await f.verify(token)).status).toBe(400)
  })

  it('rejects expired links and unprovisioned users without creating accounts or sending mail', async () => {
    const f = await fixture()
    const unknown = `${randomUUID()}@example.test`
    expect((await f.post('/auth/login').send({ email: unknown })).status).toBe(202)
    expect(f.send).not.toHaveBeenCalled()
    expect(await db!.user.findUnique({ where: { email: unknown } })).toBeNull()
    const token = await f.requestLink()
    await db!.verification.updateMany({ where: { value: { contains: f.user.email } }, data: { expiresAt: new Date(0) } })
    expect((await f.verify(token)).status).toBe(400)
    expect((await f.post('/auth/sign-up/email').send({ email: unknown })).status).toBe(404)
    expect((await request(f.app).get('/api/v1/auth/get-session')).status).toBe(404)
  })

  it('requires origin and a non-simple CSRF header for every mutation', async () => {
    const f = await fixture()
    expect((await request(f.app).post('/api/v1/auth/login').send({ email: f.user.email })).status).toBe(403)
    expect((await request(f.app).post('/api/v1/auth/logout').set('Origin', 'https://evil.test').set('X-SPC-CSRF', '1').send({})).status).toBe(403)
    expect((await request(f.app).post('/api/v1/auth/verify').set('Origin', f.environment.WEB_ORIGIN).send({ token: 'a'.repeat(32) })).status).toBe(403)
  })

  it('revokes the current session on logout and rejects replay', async () => {
    const f = await fixture()
    const cookie = await f.login()
    expect((await f.post('/auth/logout').set('Cookie', cookie).send({})).status).toBe(204)
    expect((await request(f.app).get('/api/v1/session').set('Cookie', cookie)).status).toBe(401)
    expect((await f.post('/auth/logout').set('Cookie', cookie).send({})).status).toBe(204)
    expect(await db!.membership.count({ where: { userId: f.user.id } })).toBe(1)
  })

  it.each(['idle', 'absolute', 'disabled'] as const)('rejects %s sessions immediately', async (mode) => {
    const f = await fixture()
    const cookie = await f.login()
    if (mode === 'disabled') await db!.user.update({ where: { id: f.user.id }, data: { disabledAt: new Date() } })
    else await db!.session.updateMany({ where: { userId: f.user.id }, data: mode === 'idle' ? { lastSeenAt: new Date(0) } : { expiresAt: new Date(0) } })
    expect((await request(f.app).get('/api/v1/session').set('Cookie', cookie)).status).toBe(401)
  })

  it('uses Secure host-only production cookies', async () => {
    const f = await fixture(true)
    const response = await f.verify(await f.requestLink())
    expect(response.status).toBe(204)
    const cookie = String(response.headers['set-cookie'])
    expect(cookie).toContain('__Host-spc-session=')
    expect(cookie).toMatch(/; Secure/)
    expect(cookie).not.toMatch(/Domain=/)
  })

  it('rate limits requests through the library HTTP handler', async () => {
    const f = await fixture()
    const statuses = []
    for (let i = 0; i < 6; i++) statuses.push((await f.post('/auth/login').send({ email: f.user.email })).status)
    expect(statuses).toEqual([202, 202, 202, 202, 202, 429])
  })

  it('isolates organizations, rejects viewer writes and deduplicates concurrent creation', async () => {
    const f = await fixture()
    const cookie = await f.login()
    const key = randomUUID()
    const create = () => f.post('/organizations').set('Cookie', cookie).set('Idempotency-Key', key).send({ name: 'Synthetic second org', timeZone: 'Europe/Prague' })
    const [a, b] = await Promise.all([create(), create()])
    expect(a.status).toBe(201)
    expect(b.body.data.id).toBe(a.body.data.id)
    expect((await f.post('/organizations').set('Cookie', cookie).set('Idempotency-Key', key).send({ name: 'Changed', timeZone: null })).status).toBe(409)
    const other = await fixture()
    const otherCookie = await other.login()
    const path = `/api/v1/organizations/${a.body.data.id}`
    expect((await request(other.app).get(path).set('Cookie', otherCookie)).status).toBe(404)
    await db!.membership.create({ data: { organizationId: a.body.data.id, userId: other.user.id, role: 'viewer' } })
    expect((await request(other.app).get(path).set('Cookie', otherCookie)).status).toBe(200)
    expect((await request(other.app).patch(path).set('Cookie', otherCookie).set('Origin', other.environment.WEB_ORIGIN).set('X-SPC-CSRF', '1').send({ name: 'Forbidden', timeZone: null })).status).toBe(403)
    await db!.membership.updateMany({ where: { userId: f.user.id }, data: { revokedAt: new Date() } })
    await activateAccount(db!, f.user.id)
    expect((await request(f.app).get('/api/v1/organizations').set('Cookie', cookie)).body.data).toEqual([])
    expect(await db!.membership.count({ where: { userId: f.user.id } })).toBe(2)
  })

  it('fails closed during store errors and never acknowledges failed logout revocation', async () => {
    const f = await fixture()
    const cookie = await f.login()
    const spy = vi.spyOn(db!.session, 'updateMany').mockRejectedValue(new Error('private-store-credential'))
    const failed = await request(f.app).get('/api/v1/session').set('Cookie', cookie)
    expect(failed.status).toBe(503)
    expect(JSON.stringify(failed.body)).not.toContain('private-store-credential')
    spy.mockRestore()
    const deletion = vi.spyOn(db!.session, 'deleteMany').mockRejectedValue(new Error('private-store-credential'))
    const logout = await f.post('/auth/logout').set('Cookie', cookie).send({})
    expect(logout.status).toBe(503)
    expect(logout.headers['set-cookie']).toBeUndefined()
    deletion.mockRestore()
    expect((await request(f.app).get('/api/v1/session').set('Cookie', cookie)).status).toBe(200)
  })

  it('reports delivery failure without leaking SMTP credentials and allows retry', async () => {
    const f = await fixture()
    f.send.mockRejectedValueOnce(new Error('smtp://private-mail-password'))
    const failed = await f.post('/auth/login').send({ email: f.user.email })
    expect(failed.status).toBe(503)
    expect(JSON.stringify(failed.body)).not.toContain('private-mail-password')
    expect((await f.post('/auth/login').send({ email: f.user.email })).status).toBe(202)
  })

  it('rotates the current cookie on reauthentication while preserving a separate device session', async () => {
    const f = await fixture()
    const first = await f.login()
    const second = await f.login()
    const response = await f.post('/auth/verify').set('Cookie', first).send({ token: await f.requestLink() })
    expect(response.status).toBe(204)
    expect((await request(f.app).get('/api/v1/session').set('Cookie', first)).status).toBe(401)
    expect((await request(f.app).get('/api/v1/session').set('Cookie', second)).status).toBe(200)
  })
})
