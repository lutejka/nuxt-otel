import { INVALID_SPAN_CONTEXT, type Span, trace as traceApi } from '@opentelemetry/api'
import { isTracingSuppressed } from '../utils/traceChannel'

export function useOtelTracer(namespace: string) {
  const tracer = traceApi.getTracer('nuxt-otel')

  const trace = async <Result>(spanName: string, fn: (span: Span) => Result) => {
    if (isTracingSuppressed()) {
      // Nested inside an already-untraced operation (internal route): skip the
      // span but keep running the callback with a non-recording span.
      return await fn(traceApi.wrapSpanContext(INVALID_SPAN_CONTEXT))
    }

    return await tracer.startActiveSpan(`${namespace}.${spanName}`, async (span) => {
      const value = await fn(span)
      span.end()
      return value
    })
  }

  return {
    tracer,
    trace,
  }
}
