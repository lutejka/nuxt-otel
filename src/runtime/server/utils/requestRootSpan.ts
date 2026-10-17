import { context, SpanStatusCode, trace, type Span, type Tracer } from '@opentelemetry/api'
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_URL_PATH,
} from '@opentelemetry/semantic-conventions'
import { getPathname, isInternalRoute } from './otel-routes.ts'
import { enterWithContext } from './traceChannel.ts'

/** Key under which the request-scoped root span is stashed on the h3 context. */
const ROOT_SPAN = Symbol.for('nuxt-otel.rootSpan')

interface TraceEvent {
  method?: string
  path?: string
  url?: URL
  req?: { method?: string }
  context: Record<string | symbol, unknown>
  node?: { res?: { statusCode?: number } }
}

/**
 * The Nitro runtime hook names differ between Nitro 2 (Nuxt 4) and Nitro 3
 * (Nuxt 5). Both are registered so the root span is always closed.
 */
interface RuntimeHooks {
  hook: {
    (name: 'request', fn: (event: TraceEvent) => void): unknown
    (name: 'response', fn: (response: Response, event: TraceEvent) => void): unknown
    (name: 'afterResponse', fn: (event: TraceEvent, response?: unknown) => void): unknown
  }
}

function getRequestInfo(event: TraceEvent): { method: string, pathname: string } {
  const method = event.req?.method ?? event.method ?? 'GET'
  const pathname = event.url instanceof URL ? event.url.pathname : getPathname(event.path)
  return { method, pathname }
}

function endRootSpan(event: TraceEvent, statusCode?: number): void {
  const span = event.context[ROOT_SPAN] as Span | undefined
  if (!span) {
    return
  }
  if (statusCode) {
    span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, statusCode)
  }
  span.setStatus(statusCode != null && statusCode >= 500 ? { code: SpanStatusCode.ERROR } : { code: SpanStatusCode.OK })
  span.end()
}

/**
 * Dev-only. Establishes a request-scoped root span from Nitro's `request` hook.
 *
 * Every tracing channel except `srvx.request` wraps just a single
 * middleware/route handler, and h3 invokes those as siblings from its dispatch
 * loop. Unless something spans the whole request, each of those channel spans
 * becomes its own trace root. Nitro's `srvx.request` producer provides that outer
 * span on the production server, but it is not wired up in the Nuxt 5 / Vite dev
 * server (see nitro's Vite integration, which dispatches requests straight to the
 * app's `fetch`), so the module synthesizes one there instead.
 */
export function installRequestRootSpan(nitroApp: unknown, tracer: Tracer): void {
  const hooks = (nitroApp as { hooks?: RuntimeHooks } | undefined)?.hooks
  if (!hooks) {
    return
  }

  hooks.hook('request', (event) => {
    const info = getRequestInfo(event)
    if (isInternalRoute(info.pathname)) {
      return
    }
    // An outer span (e.g. `srvx.request` or the HTTP auto-instrumentation) is
    // already active: keep it as the trace root instead of nesting a new one.
    if (trace.getSpan(context.active())) {
      return
    }

    const span = tracer.startSpan(`srvx ${info.method} ${info.pathname}`)
    span.setAttribute(ATTR_HTTP_REQUEST_METHOD, info.method)
    span.setAttribute(ATTR_URL_PATH, info.pathname)
    event.context[ROOT_SPAN] = span
    enterWithContext(trace.setSpan(context.active(), span))
  })

  // Nitro 3 (Nuxt 5): `(response, event)`.
  hooks.hook('response', (response, event) => {
    endRootSpan(event, response?.status)
  })

  // Nitro 2 (Nuxt 4): `(event, response)`.
  hooks.hook('afterResponse', (event) => {
    endRootSpan(event, event.node?.res?.statusCode)
  })
}
