import { describe, expect, it } from 'vitest'
import { loadEnvironment } from '../src/config/env.js'

describe('environment configuration', () => {
  it('provides safe local defaults', () => {
    expect(loadEnvironment({})).toEqual({
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
})
