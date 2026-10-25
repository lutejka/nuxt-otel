import type { Span } from '@opentelemetry/api'
import { context, ROOT_CONTEXT, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { getRPCMetadata, RPCType, setRPCMetadata } from '@opentelemetry/core'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { setAttr, setRpcRoute } from '../../src/runtime/server/utils/traceChannel'

function createMockSpan() {
  return { setAttribute: vi.fn() } as unknown as Span
}

describe('setAttr', () => {
  it('sets attribute when value is a string', () => {
    const span = createMockSpan()
    setAttr(span, 'key', 'value')
    expect(span.setAttribute).toHaveBeenCalledWith('key', 'value')
  })

  it('sets attribute when value is a number', () => {
    const span = createMockSpan()
    setAttr(span, 'key', 42)
    expect(span.setAttribute).toHaveBeenCalledWith('key', 42)
  })

  it('sets attribute when value is a boolean', () => {
    const span = createMockSpan()
    setAttr(span, 'key', true)
    expect(span.setAttribute).toHaveBeenCalledWith('key', true)
  })

  it('does not set attribute when value is null', () => {
    const span = createMockSpan()
    setAttr(span, 'key', null)
    expect(span.setAttribute).not.toHaveBeenCalled()
  })

  it('does not set attribute when value is undefined', () => {
    const span = createMockSpan()
    setAttr(span, 'key', undefined)
    expect(span.setAttribute).not.toHaveBeenCalled()
  })
})

describe('setRpcRoute', () => {
  beforeAll(() => {
    context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable())
  })

  it('sets the route on the active HTTP RPC metadata', () => {
    const ctx = setRPCMetadata(ROOT_CONTEXT, {
      type: RPCType.HTTP,
      span: trace.getTracer('test').startSpan('test'),
    })

    context.with(ctx, () => {
      setRpcRoute('/users/:id')
      expect(getRPCMetadata(context.active())?.route).toBe('/users/:id')
    })
  })

  it('does nothing when there is no HTTP RPC metadata', () => {
    expect(() => setRpcRoute('/')).not.toThrow()
  })
})
