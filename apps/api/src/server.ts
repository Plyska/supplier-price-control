import 'dotenv/config'
import { createApp } from './app.js'
import { loadEnvironment } from './config/env.js'

const environment = loadEnvironment()
const app = createApp({ corsOrigin: environment.WEB_ORIGIN })
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

  server.close((error) => {
    if (error) {
      console.error('Failed to close API server', error)
      process.exitCode = 1
      return
    }

    process.exitCode = 0
  })
}

server.on('error', (error) => {
  console.error('API server failed', error)
  process.exitCode = 1
})

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
