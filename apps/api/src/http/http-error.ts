import type { ApiErrorCode } from './error-response.js'

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: ApiErrorCode, message: string) {
    super(message)
  }
}
