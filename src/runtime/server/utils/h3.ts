import { SpanStatusCode, type Tracer } from '@opentelemetry/api'
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_ROUTE,
  ATTR_URL_PATH,
  ATTR_NETWORK_PROTOCOL_NAME,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_CLIENT_ADDRESS,
  ATTR_NETWORK_PEER_ADDRESS,
  ATTR_CLIENT_PORT,
  ATTR_NETWORK_PEER_PORT,
  ATTR_USER_AGENT_ORIGINAL,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
} from '@opentelemetry/semantic-conventions'
import { traceChannel, setAttr } from './traceChannel'
import {
  getRequestProtocol,
  getRequestHost,
  getRequestIP,
  getRequestHeader,
  getResponseStatus,
  getResponseStatusText,
} from 'h3'
import type { H3Event } from 'h3'

interface H3RequestMessage {
  event: H3Event
  type: 'route' | 'middleware'
}

/** Extract the matched route template from an h3 event context, if available. */
function getMatchedRoute(event: H3Event): string | undefined {
  const ctx = event.context as Record<string, { route?: string } | undefined>
  return ctx?.matchedRoute?.route
}

export function registerH3Channels(tracer: Tracer) {
  traceChannel<H3RequestMessage>('h3.request', tracer, {
    startUpdate(span, data) {
      const event = data.event
      const path = event.path
      const qIndex = path.indexOf('?')
      const pathname = qIndex === -1 ? path : path.slice(0, qIndex)
      const search = qIndex === -1 ? undefined : path.slice(qIndex + 1)

      // Prefer the matched route template (`/users/:id`) for the span name so it
      // stays low-cardinality per OTEL HTTP semconv; fall back to the concrete
      // path when the request didn't match a route (404, middleware-only).
      const route = getMatchedRoute(event)
      const target = route || pathname
      span.updateName(data.type === 'middleware' ? `middleware ${event.method} ${target}` : `${event.method} ${target}`)
      setAttr(span, ATTR_HTTP_REQUEST_METHOD, event.method)
      setAttr(span, ATTR_URL_PATH, pathname)
      setAttr(span, ATTR_NETWORK_PROTOCOL_NAME, 'http')
      if (route) {
        setAttr(span, ATTR_HTTP_ROUTE, route)
      }

      if (search) {
        setAttr(span, ATTR_URL_QUERY, search)
      }

      if (event.node) {
        const node = event.node
        setAttr(span, ATTR_URL_SCHEME, getRequestProtocol(event))
        setAttr(span, ATTR_NETWORK_PROTOCOL_VERSION, node.req.httpVersion)

        const host = getRequestHost(event)
        const colon = host.lastIndexOf(':')
        setAttr(span, ATTR_SERVER_ADDRESS, colon === -1 ? host : host.slice(0, colon))
        setAttr(span, ATTR_SERVER_PORT, colon === -1 ? 80 : Number(host.slice(colon + 1)))

        const ip = getRequestIP(event, { xForwardedFor: true })
        setAttr(span, ATTR_CLIENT_ADDRESS, ip)
        setAttr(span, ATTR_NETWORK_PEER_ADDRESS, ip)
        setAttr(span, ATTR_CLIENT_PORT, node.req.socket.remotePort)
        setAttr(span, ATTR_NETWORK_PEER_PORT, node.req.socket.remotePort)
        setAttr(span, ATTR_USER_AGENT_ORIGINAL, getRequestHeader(event, 'User-Agent'))
      }
    },
    beforeEndUpdate(span, data) {
      if (!data.event.node) return
      const statusCode = getResponseStatus(data.event)
      const statusText = getResponseStatusText(data.event)?.trim() ?? undefined
      setAttr(span, ATTR_HTTP_RESPONSE_STATUS_CODE, statusCode)
      span.setStatus(
        statusCode < 500
          ? { code: SpanStatusCode.OK, message: statusText }
          : { code: SpanStatusCode.ERROR, message: statusText },
      )
    },
  })
}
