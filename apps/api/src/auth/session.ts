import type { Request } from 'express'
import type { PrismaClient } from '@supplier-price-control/db'
import type { Auth } from './auth.js'
import { HttpError } from '../http/http-error.js'

export function authHeaders(request: Request) {
  const headers = new Headers()
  for (const key of ['cookie', 'origin', 'user-agent', 'sec-fetch-site']) {
    const value = request.get(key)
    if (value) headers.set(key, value)
  }
  // Never trust a caller-supplied forwarding header; Express resolves configured proxies.
  headers.set('x-spc-client-ip', request.ip ?? request.socket.remoteAddress ?? '127.0.0.1')
  return headers
}

export async function requireSession(auth: Auth, db: PrismaClient, request: Request, idleSeconds: number) {
  const result = await auth.api.getSession({ headers: authHeaders(request) })
  if (!result) throw new HttpError(401, 'SESSION_REQUIRED', 'Sign in required')
  const now = new Date()
  // One conditional update prevents an expired/revoked session being revived by a race.
  const touched = await db.session.updateMany({
    where: {
      id: result.session.id,
      expiresAt: { gt: now },
      lastSeenAt: { gt: new Date(now.getTime() - idleSeconds * 1000) },
      user: { disabledAt: null, emailVerified: true },
    },
    data: { lastSeenAt: now },
  })
  if (touched.count !== 1) throw new HttpError(401, 'SESSION_REQUIRED', 'Sign in required')
  return { userId: result.user.id, email: result.user.email, displayName: result.user.name }
}
