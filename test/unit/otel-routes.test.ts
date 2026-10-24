import { describe, expect, it } from 'vitest'
import { getPathname, isInternalRoute } from '../../src/runtime/server/utils/otel-routes'

describe('getPathname', () => {
  it('returns an empty string for undefined', () => {
    expect(getPathname(undefined)).toBe('')
  })

  it('keeps a plain pathname', () => {
    expect(getPathname('/api/orders')).toBe('/api/orders')
  })

  it('strips the query string', () => {
    expect(getPathname('/api/orders?limit=10')).toBe('/api/orders')
  })

  it('strips the hash', () => {
    expect(getPathname('/api/orders#section')).toBe('/api/orders')
  })

  it('strips scheme and host from an absolute URL', () => {
    expect(getPathname('http://localhost:3000/__otel/traces')).toBe('/__otel/traces')
  })

  it('returns a slash for an absolute URL without a path', () => {
    expect(getPathname('http://localhost:3000')).toBe('/')
  })
})

describe('isInternalRoute (devtools enabled, dev)', () => {
  it('matches the opentelemetry ingest endpoint', () => {
    expect(isInternalRoute('/__opentelemetry-ingest')).toBe(true)
  })

  it('matches the devtools base', () => {
    expect(isInternalRoute('/__opentelemetry/__mcp')).toBe(true)
  })

  it('matches the otel prefix', () => {
    expect(isInternalRoute('/__otel')).toBe(true)
  })

  it('matches the nuxt-otel prefix', () => {
    expect(isInternalRoute('/__nuxt-otel')).toBe(true)
  })

  it('matches absolute URLs with a query string', () => {
    expect(isInternalRoute('http://localhost:3000/__opentelemetry-ingest?v=1')).toBe(true)
  })

  it('does not match regular routes', () => {
    expect(isInternalRoute('/api/orders')).toBe(false)
  })

  it('does not match a path that merely contains a prefix', () => {
    expect(isInternalRoute('/api/__otel')).toBe(false)
  })

  it('does not match undefined or empty input', () => {
    expect(isInternalRoute(undefined)).toBe(false)
    expect(isInternalRoute('')).toBe(false)
  })
})
