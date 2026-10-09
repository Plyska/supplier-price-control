import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/', (_request, response) => {
  response.status(200).json({
    data: {
      status: 'ok',
    },
    requestId: response.locals.requestId as string,
  })
})
