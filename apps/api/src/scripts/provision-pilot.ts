import 'dotenv/config'
import { createDatabase } from '@supplier-price-control/db'
import { loadEnvironment } from '../config/env.js'
import { provisionPilot } from '../auth/provision.js'

const env = loadEnvironment()
const db = createDatabase({ connectionString: env.DATABASE_URL, maxConnections: 1 })
try {
  const [email, displayName] = process.argv.slice(2)
  const user = await provisionPilot(db, { email, displayName })
  console.info(`Pilot account ready: ${user.id}. Email verification is required at login.`)
} catch {
  console.error('Provisioning failed. Usage: pnpm auth:provision email "Display name". Check configuration and database availability.')
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
