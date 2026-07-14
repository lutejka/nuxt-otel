import { trace as traceApi, type Span } from '@opentelemetry/api'

export function useOtelTracer(namespace: string) {
  const tracer = traceApi.getTracer('nuxt-otel')

  const trace = async <Result>(spanName: string, fn: (span: Span) => Result) => {
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
