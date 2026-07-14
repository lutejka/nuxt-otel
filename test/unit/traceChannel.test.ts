import { describe, it, expect, vi } from 'vitest'
import { setAttr } from '../../src/runtime/server/utils/traceChannel'
import type { Span } from '@opentelemetry/api'

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
