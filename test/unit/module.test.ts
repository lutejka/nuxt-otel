import { describe, it, expect, vi } from 'vitest'

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: vi.fn(() => vi.fn()),
  createResolver: vi.fn(() => ({ resolve: (...p: string[]) => p.join('/') })),
  addServerPlugin: vi.fn(),
  addServerTemplate: vi.fn(),
  useLogger: vi.fn(() => ({ warn: vi.fn(), success: vi.fn(), info: vi.fn() })),
}))

// eslint-disable-next-line import/first
import { normalizeTracingChannel } from '../../src/module'

describe('normalizeTracingChannel', () => {
  it('returns all true when val is true', () => {
    expect(normalizeTracingChannel(true)).toEqual({
      nuxt: true,
      h3: true,
      srvx: true,
      unstorage: true,
    })
  })

  it('returns all false when val is false', () => {
    expect(normalizeTracingChannel(false)).toEqual({
      nuxt: false,
      h3: false,
      srvx: false,
      unstorage: false,
    })
  })

  it('returns all false when val is undefined', () => {
    expect(normalizeTracingChannel(undefined)).toEqual({
      nuxt: false,
      h3: false,
      srvx: false,
      unstorage: false,
    })
  })

  it('merges partial options with defaults to true', () => {
    expect(normalizeTracingChannel({ nuxt: false })).toEqual({
      nuxt: false,
      h3: true,
      srvx: true,
      unstorage: true,
    })
  })

  it('merges multiple false values', () => {
    expect(normalizeTracingChannel({ nuxt: false, h3: false })).toEqual({
      nuxt: false,
      h3: false,
      srvx: true,
      unstorage: true,
    })
  })

  it('accepts empty object and returns all true', () => {
    expect(normalizeTracingChannel({})).toEqual({
      nuxt: true,
      h3: true,
      srvx: true,
      unstorage: true,
    })
  })
})
