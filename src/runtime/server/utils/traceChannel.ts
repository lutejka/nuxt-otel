import type { AsyncLocalStorage } from 'node:async_hooks'
import { tracingChannel as createTracingChannel } from 'node:diagnostics_channel'
import { type Span, type Tracer, SpanStatusCode, context, trace } from '@opentelemetry/api'

export function setAttr(span: Span, key: string, value: unknown) {
  if (value !== null && value !== undefined) {
    span.setAttribute(key, value as number | string | boolean)
  }
}

export function traceChannel<T>(
  channelName: string,
  tracer: Tracer,
  {
    startUpdate,
    beforeEndUpdate,
    errorUpdate,
  }: {
    startUpdate?: (span: Span, data: T) => void
    beforeEndUpdate?: (span: Span, data: T) => void
    errorUpdate?: (span: Span, data: T) => void
  },
) {
  const contextManager = (
    context as unknown as {
      _getContextManager(): { _asyncLocalStorage: AsyncLocalStorage<object> } | undefined
    }
  )._getContextManager()
  if (!contextManager?._asyncLocalStorage) {
    console.warn('Propagation will not work without asyncLocalStorage')
    return
  }
  const channel = createTracingChannel(channelName)
  channel.start.bindStore(contextManager._asyncLocalStorage, (rawData) => {
    const data = rawData as T
    const span = tracer.startSpan(channelName)
    startUpdate?.(span, data)
    ;(rawData as Record<string, unknown>).span = span
    return trace.setSpan(context.active(), span)
  })
  channel.subscribe({
    start() {},
    asyncStart() {},
    asyncEnd(data) {
      const { span, ...restData } = data as T & { span?: Span & { status: { code: SpanStatusCode } } }
      if (!span) return
      span.setStatus({ code: SpanStatusCode.OK })

      if (span.status.code === SpanStatusCode.UNSET) {
        span.setStatus({ code: SpanStatusCode.OK })
      }
      beforeEndUpdate?.(span, restData as T)
      span.end()
    },
    end() {},
    error(data) {
      const { span, error, ...restData } = data as T & {
        span?: Span & { status: { code: SpanStatusCode } }
        error?: Error
      }
      if (!span) return
      errorUpdate?.(span, restData as T)
      if (error) span.recordException(error)
      // set span status to error when it was not set in errorUpdate()
      if (span.status.code === SpanStatusCode.UNSET) {
        span.setStatus({ code: SpanStatusCode.ERROR })
      }
      span.end()
    },
  })
}
