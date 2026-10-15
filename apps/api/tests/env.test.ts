import { describe, expect, it } from 'vitest'
import { loadEnvironment } from '../src/config/env.js'

describe('environment configuration', () => {
  it('provides safe local defaults', () => {
    expect(loadEnvironment({})).toEqual({
      DATABASE_URL:
        'postgresql://spc_app:local_app_password@127.0.0.1:5433/supplier_price_control?schema=app',
      DATABASE_POOL_MAX: 5,
      HOST: '127.0.0.1',
      NODE_ENV: 'development',
      PORT: 3000,
      WEB_ORIGIN: 'http://localhost:5173',
    })
  })

  it('rejects an invalid port', () => {
    expect(() => loadEnvironment({ PORT: '70000' })).toThrow(
      'Invalid environment configuration',
    )
  })

  it('normalizes the configured frontend origin', () => {
    expect(
      loadEnvironment({ WEB_ORIGIN: 'https://app.example.com/path' })
        .WEB_ORIGIN,
    ).toBe('https://app.example.com')
  })

  it('requires explicit runtime database credentials in production', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'production' })).toThrow('DATABASE_URL')
  })

  it('rejects non-PostgreSQL URLs without exposing their credentials', () => {
    expect(() => loadEnvironment({ DATABASE_URL: 'https://user:secret@example.com' }))
      .toThrow('Expected a PostgreSQL connection URL')
    expect(() => loadEnvironment({ DATABASE_URL: 'invalid-secret' }))
      .toThrow('Invalid environment configuration: DATABASE_URL')
    expect(() => loadEnvironment({ DATABASE_URL: 'invalid-secret' }))
      .not.toThrow('invalid-secret')
  })

  it('rejects an unbounded connection pool', () => {
    expect(() => loadEnvironment({ DATABASE_POOL_MAX: '0' })).toThrow('DATABASE_POOL_MAX')
    expect(() => loadEnvironment({ DATABASE_POOL_MAX: '21' })).toThrow('DATABASE_POOL_MAX')
  })
})
