import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('API', () => {
  it('returns the health status and request ID', async () => {
    const response = await request(createApp()).get('/api/v1/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: {
        status: 'ok',
      },
      requestId: response.headers['x-request-id'],
    })
    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('returns a structured error for an unknown route', async () => {
    const response = await request(createApp()).get('/api/v1/unknown')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found',
        requestId: response.headers['x-request-id'],
      },
    })
  })

  it('returns a structured error for malformed JSON', async () => {
    const response = await request(createApp())
      .post('/api/v1/unknown')
      .set('Content-Type', 'application/json')
      .send('{')

    expect(response.status).toBe(400)
    expect(response.body.error).toEqual({
      code: 'BAD_REQUEST',
      message: 'Invalid request body',
      requestId: response.headers['x-request-id'],
    })
  })

  it('allows credentialed requests from the configured frontend origin', async () => {
    const frontendOrigin = 'http://frontend.test'
    const response = await request(createApp({ corsOrigin: frontendOrigin }))
      .options('/api/v1/health')
      .set('Origin', frontendOrigin)
      .set('Access-Control-Request-Method', 'GET')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe(frontendOrigin)
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })
})
