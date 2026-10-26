import { type Context, context, type Span, SpanStatusCode, trace, type Tracer } from '@opentelemetry/api'
import { getRPCMetadata, RPCType } from '@opentelemetry/core'
import type { AsyncLocalStorage } from 'node:async_hooks'
import { tracingChannel as createTracingChannel } from 'node:diagnostics_channel'

/**
 * Context key marking a request (or nested operation) whose tracing has been
 * suppressed (e.g. internal devtools/ingest routes). Nested channels and the
 * `useOtelTracer` composable check this to avoid creating spans.
 */
export const SUPPRESS_TRACING_KEY = Symbol.for('nuxt-otel.suppress')

/** Whether tracing is suppressed in the currently active context. */
export function isTracingSuppressed(): boolean {
  return context.active().getValue(SUPPRESS_TRACING_KEY) === true
}

/** OTel's async-hooks context manager keeps its store in a private ALS. */
function getContextStore(): AsyncLocalStorage<Context> | undefined {
  return (
    context as unknown as {
      _getContextManager(): { _asyncLocalStorage?: AsyncLocalStorage<Context> } | undefined
    }
  )._getContextManager()?._asyncLocalStorage
}

/**
 * Make `ctx` the active OpenTelemetry context for the current async scope and
 * everything it spawns.
 *
 * Unlike `context.with`, this persists after the caller returns, which is what
 * lets a request-scoped root span (established from a Nitro `request` hook)
 * remain active while the h3 dispatch loop later runs the individual
 * middleware/route handlers.
 */
export function enterWithContext(ctx: Context): void {
  getContextStore()?.enterWith(ctx)
}

export function setAttr(span: Span, key: string, value: unknown) {
  if (value !== null && value !== undefined) {
    span.setAttribute(key, value as number | string | boolean)
  }
}

/**
 * Publish the matched route template to the active RPC metadata. Node's HTTP
 * instrumentation reads it when the response closes and renames its parent
 * server span to `METHOD <route>` (otherwise it keeps just the method name).
 * The metadata lives on a `Symbol.for` context key, so this works even when
 * the host app resolves a different copy of `@opentelemetry/core`.
 */
export function setRpcRoute(route: string): void {
  const metadata = getRPCMetadata(context.active())
  if (metadata?.type === RPCType.HTTP) {
    metadata.route = route
  }
}

export function traceChannel<T>(
  channelName: string,
  tracer: Tracer,
  {
    startUpdate,
    beforeEndUpdate,
    errorUpdate,
    skip,
  }: {
    startUpdate?: (span: Span, data: T) => void
    beforeEndUpdate?: (span: Span, data: T) => void
    errorUpdate?: (span: Span, data: T) => void
    skip?: (data: T) => boolean
  },
) {
  const contextStore = getContextStore()
  if (!contextStore) {
    console.warn('Propagation will not work without asyncLocalStorage')
    return
  }
  const channel = createTracingChannel(channelName)
  channel.start.bindStore(contextStore, (rawData) => {
    const data = rawData as T
    if (skip?.(data)) {
      // Propagate suppression to nested channels/composables in this request
      // so that, e.g., `nuxt.plugin` spans are skipped once `nuxt.render` is.
      return context.active().setValue(SUPPRESS_TRACING_KEY, true)
    }
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

      if (span.status?.code === SpanStatusCode.UNSET) {
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
      if (span.status?.code === SpanStatusCode.UNSET) {
        span.setStatus({ code: SpanStatusCode.ERROR })
      }
      span.end()
    },
  })
}
