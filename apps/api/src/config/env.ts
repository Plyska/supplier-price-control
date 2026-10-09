import { z } from 'zod'

const environmentSchema = z.object({
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
  const result = environmentSchema.safeParse(source)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid environment configuration: ${issues}`)
  }

  return result.data
}
