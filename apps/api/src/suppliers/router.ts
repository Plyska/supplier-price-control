import { Router } from 'express'
import {
  supplierInputSchema,
  supplierListQuerySchema,
} from '@supplier-price-control/contracts'
import type { PrismaClient } from '@supplier-price-control/db'
import { z } from 'zod'
import type { Auth } from '../auth/auth.js'
import { requireSession } from '../auth/session.js'
import type { Environment } from '../config/env.js'
import { asyncHandler } from '../http/async-handler.js'
import { createCsrfGuard } from '../http/csrf.js'
import { requireOrganizationContext } from '../organizations/access.js'
import {
  archiveSupplier,
  createSupplier,
  getSupplier,
  listSuppliers,
  restoreSupplier,
  updateSupplier,
} from './service.js'

export function supplierRouter(
  auth: Auth,
  database: PrismaClient,
  environment: Environment,
) {
  const router = Router({ mergeParams: true })
  const csrf = createCsrfGuard(environment)
  const currentContext = async (
    organizationIdValue: unknown,
    request: Parameters<typeof requireSession>[2],
    permission: 'read' | 'write',
  ) => {
    const organizationId = z.uuid().parse(organizationIdValue)
    const { userId } = await requireSession(
      auth,
      database,
      request,
      environment.AUTH_SESSION_IDLE_SECONDS,
    )
    return requireOrganizationContext(database, userId, organizationId, permission)
  }

  router.use((_request, response, next) => {
    response.set('Cache-Control', 'private, no-store')
    next()
  })

  router.get('/', asyncHandler(async (request, response) => {
    const context = await currentContext(request.params.organizationId, request, 'read')
    const query = supplierListQuerySchema.parse(request.query)
    response.json({ data: await listSuppliers(database, context, query) })
  }))

  router.post('/', csrf, asyncHandler(async (request, response) => {
    const context = await currentContext(request.params.organizationId, request, 'write')
    const input = supplierInputSchema.parse(request.body)
    const supplier = await createSupplier(
      database,
      context,
      input,
      response.locals.requestId as string,
    )
    response.status(201).json({ data: supplier })
  }))

  router.get('/:supplierId', asyncHandler(async (request, response) => {
    const context = await currentContext(request.params.organizationId, request, 'read')
    const supplierId = z.uuid().parse(request.params.supplierId)
    response.json({ data: await getSupplier(database, context, supplierId) })
  }))

  router.patch('/:supplierId', csrf, asyncHandler(async (request, response) => {
    const context = await currentContext(request.params.organizationId, request, 'write')
    const supplierId = z.uuid().parse(request.params.supplierId)
    const input = supplierInputSchema.parse(request.body)
    response.json({
      data: await updateSupplier(
        database,
        context,
        supplierId,
        input,
        response.locals.requestId as string,
      ),
    })
  }))

  router.post('/:supplierId/archive', csrf, asyncHandler(async (request, response) => {
    const context = await currentContext(request.params.organizationId, request, 'write')
    const supplierId = z.uuid().parse(request.params.supplierId)
    response.json({
      data: await archiveSupplier(
        database,
        context,
        supplierId,
        response.locals.requestId as string,
      ),
    })
  }))

  router.post('/:supplierId/restore', csrf, asyncHandler(async (request, response) => {
    const context = await currentContext(request.params.organizationId, request, 'write')
    const supplierId = z.uuid().parse(request.params.supplierId)
    response.json({
      data: await restoreSupplier(
        database,
        context,
        supplierId,
        response.locals.requestId as string,
      ),
    })
  }))

  return router
}
