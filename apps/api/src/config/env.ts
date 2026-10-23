import { z } from 'zod'

const environmentSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_SESSION_IDLE_SECONDS: z.coerce.number().int().min(60).max(2_592_000).default(604_800),
  AUTH_SESSION_ABSOLUTE_SECONDS: z.coerce.number().int().min(60).max(7_776_000).default(2_592_000),
  SMTP_HOST: z.string().min(1).default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  MAIL_FROM: z.email().default('login@example.test'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => {
      try {
        return ['postgres:', 'postgresql:'].includes(new URL(value).protocol)
      } catch {
        return false
      }
    }, {
      message: 'Expected a PostgreSQL connection URL',
    }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  WEB_ORIGIN: z
    .string()
    .url()
    .transform((value) => new URL(value).origin)
    .default('http://localhost:5173'),
})

export type Environment = z.infer<typeof environmentSchema>

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  const result = environmentSchema.safeParse({
    ...source,
    AUTH_SECRET: source.AUTH_SECRET ?? (source.NODE_ENV === 'production' ? undefined : 'local-development-only-auth-secret-do-not-deploy'),
    DATABASE_URL:
      source.DATABASE_URL ??
      (source.NODE_ENV === 'production'
        ? undefined
        : 'postgresql://spc_app:local_app_password@127.0.0.1:5433/supplier_price_control?schema=app'),
  })

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid environment configuration: ${issues}`)
  }

  if (Boolean(result.data.SMTP_USER) !== Boolean(result.data.SMTP_PASSWORD)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together')
  }
  if (result.data.AUTH_SESSION_IDLE_SECONDS > result.data.AUTH_SESSION_ABSOLUTE_SECONDS) {
    throw new Error('Session idle expiration must not exceed absolute expiration')
  }
  if (result.data.NODE_ENV === 'production' && (
    !result.data.WEB_ORIGIN.startsWith('https://') ||
    !source.SMTP_HOST || !source.MAIL_FROM ||
    result.data.AUTH_SECRET === 'local-development-only-auth-secret-do-not-deploy'
  )) {
    throw new Error('Production requires HTTPS WEB_ORIGIN, SMTP_HOST, MAIL_FROM and a private AUTH_SECRET')
  }

  return result.data
}
