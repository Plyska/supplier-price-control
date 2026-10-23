import type { Response } from 'express'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR'
  | 'ROUTE_NOT_FOUND'
  | 'SESSION_REQUIRED'
  | 'INVALID_ORIGIN'
  | 'INVALID_INPUT'
  | 'AUTH_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_LOGIN'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'

export function sendError(
  response: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  return response.status(status).json({
    error: {
      code,
      message,
      requestId: response.locals.requestId as string,
    },
  })
}
