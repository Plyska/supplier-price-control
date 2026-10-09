import type { Response } from 'express'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'ROUTE_NOT_FOUND'

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
