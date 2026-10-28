import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const migrationUrl = process.env.MIGRATION_DATABASE_URL
const shadowUrl = process.env.SHADOW_DATABASE_URL

function parseConnectionUrl(value: string, name: string) {
  try {
    const url = new URL(value)
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error()
    return url
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection URL`)
  }
}

if (migrationUrl && shadowUrl) {
  const migration = parseConnectionUrl(migrationUrl, 'MIGRATION_DATABASE_URL')
  const shadow = parseConnectionUrl(shadowUrl, 'SHADOW_DATABASE_URL')
  const localHosts = ['localhost', '127.0.0.1', '[::1]']
  const sameHost = migration.hostname === shadow.hostname ||
    (localHosts.includes(migration.hostname) && localHosts.includes(shadow.hostname))
  if (
    sameHost &&
    (migration.port || '5432') === (shadow.port || '5432') &&
    migration.pathname === shadow.pathname
  ) {
    throw new Error('SHADOW_DATABASE_URL must target a separate disposable database')
  }
}

// Generation/builds do not need credentials. Migration commands require an
// explicit migration URL and never fall back to the runtime connection.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationUrl,
    shadowDatabaseUrl: shadowUrl,
  },
})
