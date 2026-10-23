import { Router, type Request, type Response, type RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '@supplier-price-control/db'
import type { Environment } from '../config/env.js'
import { HttpError } from '../http/http-error.js'
import { sendError } from '../http/error-response.js'
import { activateAccount, createOrganization } from '../organizations/service.js'
import type { Auth } from './auth.js'
import { authHeaders, requireSession } from './session.js'
import { pilotInput } from './provision.js'

const organizationInput = z.object({
  name: z.string().trim().min(1).max(200),
  timeZone: z.string().max(100).refine((value) => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false }
  }).nullable(),
}).strict()

export function identityRouter(auth: Auth, db: PrismaClient, env: Environment) {
  const router = Router()
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    res.set('Referrer-Policy', 'no-referrer')
    next()
  })
  const csrf: RequestHandler = (req, _res, next) => {
    if (req.get('origin') !== env.WEB_ORIGIN || req.get('x-spc-csrf') !== '1' || !req.is('application/json')) {
      next(new HttpError(403, 'INVALID_ORIGIN', 'Request origin is not allowed'))
      return
    }
    next()
  }
  const safe = (handler: (req: Request, res: Response) => Promise<void>): RequestHandler => async (req, res, next) => {
    try { await handler(req, res) } catch (error) {
      if (error instanceof HttpError) return next(error)
      if (error instanceof z.ZodError) return next(new HttpError(400, 'INVALID_INPUT', 'Invalid request data'))
      // Never emit upstream database/SMTP errors, request bodies or URLs.
      console.error('Identity service unavailable', { requestId: res.locals.requestId })
      next(new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication service is unavailable'))
    }
  }
  const current = (req: Request) => requireSession(auth, db, req, env.AUTH_SESSION_IDLE_SECONDS)
  const dispatch = async (req: Request, path: string, body?: unknown) => {
    const headers = authHeaders(req)
    if (body !== undefined) headers.set('content-type', 'application/json')
    return auth.handler(new Request(`${env.WEB_ORIGIN}/api/v1/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }))
  }
  const checkUpstream = (upstream: globalThis.Response) => {
    if (upstream.status === 429) throw new HttpError(429, 'RATE_LIMITED', 'Try again later')
    if (upstream.status >= 500) throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication service is unavailable')
    if (upstream.status >= 400) throw new HttpError(400, 'INVALID_LOGIN', 'Unable to sign in')
  }
  const cookies = (upstream: globalThis.Response, res: Response) => {
    for (const value of upstream.headers.getSetCookie()) res.append('Set-Cookie', value)
  }

  router.post('/auth/login', csrf, safe(async (req, res) => {
    console.log('Login request body:', req.body)
    const { email } = pilotInput.pick({ email: true }).parse(req.body)
    const upstream = await dispatch(req, '/sign-in/magic-link', {
      email, callbackURL: '/', errorCallbackURL: '/login',
    })
    checkUpstream(upstream)
    res.status(202).json({ data: { accepted: true } })
  }))

  router.post('/auth/verify', csrf, safe(async (req, res) => {
    const { token } = z.object({ token: z.string().regex(/^[a-zA-Z]{32}$/) }).parse(req.body)
    const query = new URLSearchParams({ token, callbackURL: '/', errorCallbackURL: '/login' })
    const upstream = await dispatch(req, `/magic-link/verify?${query}`)
    checkUpstream(upstream)
    const location = upstream.headers.get('location')
    if (!location || new URL(location, env.WEB_ORIGIN).searchParams.has('error')) {
      throw new HttpError(400, 'INVALID_LOGIN', 'Link is invalid or expired')
    }
    const headers = new Headers({ cookie: upstream.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ') })
    const session = await auth.api.getSession({ headers })
    if (!session) throw new HttpError(400, 'INVALID_LOGIN', 'Unable to sign in')
    await activateAccount(db, session.user.id)
    const previous = await auth.api.getSession({ headers: authHeaders(req) })
    if (previous && previous.session.id !== session.session.id) {
      await db.session.deleteMany({ where: { id: previous.session.id } })
    }
    cookies(upstream, res)
    res.status(204).end()
  }))
  router.post('/auth/logout', csrf, safe(async (req, res) => {
    // Exercise the store even without a valid cookie; an outage must not acknowledge logout.
    await db.$queryRaw`SELECT 1`
    const session = await auth.api.getSession({ headers: authHeaders(req) })
    // Better Auth sign-out catches deletion failures. Enforce our stronger
    // revocation contract first, then use the library to clear signed cookies.
    if (session) await db.session.deleteMany({ where: { id: session.session.id } })
    const upstream = await dispatch(req, '/sign-out', {})
    checkUpstream(upstream)
    cookies(upstream, res)
    res.status(204).end()
  }))
  router.get('/session', safe(async (req, res) => {
    res.json({ data: { user: await current(req) } })
  }))
  router.get('/organizations', safe(async (req, res) => {
    const { userId } = await current(req)
    const memberships = await db.membership.findMany({
      where: { userId, revokedAt: null }, include: { organization: true }, orderBy: { createdAt: 'asc' },
    })
    res.json({ data: memberships.map(({ organization, role }) => ({ ...organization, role })) })
  }))
  router.post('/organizations', csrf, safe(async (req, res) => {
    const { userId } = await current(req)
    const key = z.uuid().parse(req.get('idempotency-key'))
    const result = await createOrganization(db, userId, key, organizationInput.parse(req.body))
    res.status(201).json({ data: { ...result, role: 'owner' } })
  }))
  router.get('/organizations/:organizationId', safe(async (req, res) => {
    const { userId } = await current(req)
    const organizationId = z.uuid().parse(req.params.organizationId)
    const membership = await db.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } }, include: { organization: true },
    })
    if (!membership || membership.revokedAt) throw new HttpError(404, 'NOT_FOUND', 'Organization not found')
    res.json({ data: { ...membership.organization, role: membership.role } })
  }))
  router.patch('/organizations/:organizationId', csrf, safe(async (req, res) => {
    const { userId } = await current(req)
    const organizationId = z.uuid().parse(req.params.organizationId)
    const data = organizationInput.parse(req.body)
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT user_id FROM app.memberships WHERE organization_id = ${organizationId}::uuid AND user_id = ${userId}::uuid FOR UPDATE`
      const membership = await tx.membership.findUnique({ where: { organizationId_userId: { organizationId, userId } } })
      if (!membership || membership.revokedAt) throw new HttpError(404, 'NOT_FOUND', 'Organization not found')
      if (membership.role !== 'owner') throw new HttpError(403, 'FORBIDDEN', 'Owner permission required')
      const organization = await tx.organization.update({ where: { id: organizationId }, data })
      await tx.auditEvent.create({ data: { organizationId, actorUserId: userId, action: 'organization.updated', entityType: 'organization', entityId: organizationId } })
      return organization
    })
    res.json({ data: { ...result, role: 'owner' } })
  }))
  // Expose only these routes. Library account/session mutation endpoints are private.
  router.all('/auth/{*path}', (_req, res) => sendError(res, 404, 'ROUTE_NOT_FOUND', 'Route not found'))
  return router
}
