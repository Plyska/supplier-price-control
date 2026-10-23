import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { magicLink } from 'better-auth/plugins'
import type { PrismaClient } from '@supplier-price-control/db'
import type { Environment } from '../config/env.js'

export type LoginMail = { email: string; url: string }
export type SendLoginMail = (mail: LoginMail) => Promise<void>

export function createAuth(database: PrismaClient, env: Environment, sendMail: SendLoginMail) {
  return betterAuth({
    appName: 'Supplier Price Control',
    baseURL: env.WEB_ORIGIN,
    basePath: '/api/v1/auth',
    secret: env.AUTH_SECRET,
    database: prismaAdapter(database, { provider: 'postgresql', transaction: true }),
    trustedOrigins: [env.WEB_ORIGIN],
    user: { fields: { name: 'displayName' } },
    session: {
      expiresIn: env.AUTH_SESSION_ABSOLUTE_SECONDS,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60 },
    advanced: {
      database: { generateId: 'uuid' },
      ipAddress: { ipAddressHeaders: ['x-spc-client-ip'] },
      useSecureCookies: env.NODE_ENV === 'production',
      cookies: {
        session_token: {
          name: env.NODE_ENV === 'production' ? '__Host-spc-session' : 'spc-session',
          attributes: { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
        },
      },
    },
    // Never log auth requests, credentials, tokens, mail contents or adapter errors.
    logger: { disabled: true },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await database.user.findUnique({ where: { id: session.userId } })
            if (!user?.emailVerified || user.disabledAt) return false
            return { data: session }
          },
        },
      },
    },
    plugins: [magicLink({
      disableSignUp: true,
      expiresIn: 600,
      storeToken: 'hashed',
      rateLimit: { window: 60, max: 5 },
      sendMagicLink: async ({ email, token }) => {
        const user = await database.user.findUnique({ where: { email } })
        if (!user || user.disabledAt) return
        // A URL fragment is not sent to the web server or in Referer headers.
        // Only an explicit confirmation POST consumes the single-use token.
        const url = new URL('/login/verify', env.WEB_ORIGIN)
        url.hash = new URLSearchParams({ token }).toString()
        await sendMail({ email, url: url.toString() })
      },
    })],
  })
}

export type Auth = ReturnType<typeof createAuth>
