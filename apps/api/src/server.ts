import 'dotenv/config'
import { createDatabase } from '@supplier-price-control/db'
import { createApp } from './app.js'
import { loadEnvironment } from './config/env.js'

const environment = loadEnvironment()
const database = createDatabase({
  connectionString: environment.DATABASE_URL,
  maxConnections: environment.DATABASE_POOL_MAX,
})
const app = createApp({
  corsOrigin: environment.WEB_ORIGIN,
  checkDatabase: async () => {
    await database.$queryRaw`SELECT 1`
  },
})
const server = app.listen(environment.PORT, environment.HOST, () => {
  console.info(
    `API listening on http://${environment.HOST}:${environment.PORT}`,
  )
})

let isShuttingDown = false

function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.info(`Received ${signal}; closing API server`)

  const shutdownTimeout = setTimeout(() => {
    console.error('API shutdown timed out')
    process.exit(1)
  }, 10_000)
  shutdownTimeout.unref()

  server.close((error) => {
    if (error) {
      console.error('Failed to close API server', error)
    }

    void database.$disconnect().then(
      () => {
        clearTimeout(shutdownTimeout)
        process.exitCode = error ? 1 : 0
      },
      () => {
        console.error('Failed to disconnect database')
        process.exitCode = 1
      },
    )
  })
}

server.on('error', (error) => {
  console.error('API server failed', error)
  process.exitCode = 1
  void database.$disconnect().catch(() => {
    console.error('Failed to disconnect database')
  })
})

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
