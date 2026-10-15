import cors from 'cors'
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express'
import { sendError } from './http/error-response.js'
import { requestId } from './http/request-id.js'
import { healthRouter } from './routes/health.js'

const notFound: RequestHandler = (_request, response) => {
  sendError(response, 404, 'ROUTE_NOT_FOUND', 'Route not found')
}

const handleError: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error)
    return
  }

  const requestIdValue = response.locals.requestId as string
  const isBadRequest =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 400

  if (!isBadRequest) {
    console.error('Unhandled API error', { requestId: requestIdValue, error })
  }

  sendError(
    response,
    isBadRequest ? 400 : 500,
    isBadRequest ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
    isBadRequest ? 'Invalid request body' : 'Internal server error',
  )
}

type AppOptions = {
  corsOrigin?: string
  checkDatabase?: () => Promise<void>
}

export function createApp({
  corsOrigin = 'http://localhost:5173',
  checkDatabase,
}: AppOptions = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.use(requestId)
  app.use(
    cors({
      credentials: true,
      origin: corsOrigin,
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/v1/health', healthRouter)

  app.get('/api/v1/ready', async (_request, response) => {
    try {
      if (!checkDatabase) {
        throw new Error('Database check is not configured')
      }

      await checkDatabase()
      response.status(200).json({
        data: { status: 'ok' },
        requestId: response.locals.requestId as string,
      })
    } catch {
      sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Database is unavailable')
    }
  })

  app.use(notFound)
  app.use(handleError)

  return app
}
