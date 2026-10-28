import type { RequestHandler } from 'express'
import type { Environment } from '../config/env.js'
import { HttpError } from './http-error.js'

export function createCsrfGuard(environment: Environment): RequestHandler {
  return (request, _response, next) => {
    if (
      request.get('origin') !== environment.WEB_ORIGIN ||
      request.get('x-spc-csrf') !== '1' ||
      !request.is('application/json')
    ) {
      next(new HttpError(403, 'INVALID_ORIGIN', 'Request origin is not allowed'))
      return
    }
    next()
  }
}
