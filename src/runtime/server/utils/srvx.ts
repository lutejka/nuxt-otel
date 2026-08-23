import { SpanStatusCode, type Span, type Tracer } from '@opentelemetry/api'
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_ROUTE,
  ATTR_URL_PATH,
  ATTR_URL_SCHEME,
  ATTR_NETWORK_PROTOCOL_NAME,
  ATTR_CLIENT_ADDRESS,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_NETWORK_PEER_ADDRESS,
  ATTR_USER_AGENT_ORIGINAL,
  ATTR_URL_QUERY,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_CLIENT_PORT,
  ATTR_NETWORK_PEER_PORT,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
} from '@opentelemetry/semantic-conventions'
import { traceChannel, setAttr } from './traceChannel'
import { isInternalRoute } from './otel-routes'

interface SrvxRequestMessage {
  request: {
    readonly url: string
    readonly method: string
    readonly headers: Headers
    ip?: string
    _url?: URL
    context?: { matchedRoute?: { route?: string } }
    runtime?: {
      node?: {
        req: { httpVersion: string, socket: { remotePort?: number } }
      }
    }
  }
  result: Response
}

interface SrvxMiddlewareMessage extends SrvxRequestMessage {
  middleware: {
    index: number
  }
}

/** Parse the request URL, tolerating malformed values instead of throwing. */
function getSrvxUrl(data: SrvxRequestMessage): URL | undefined {
  if (data.request._url) return data.request._url
  try {
    return new URL(data.request.url)
  }
  catch {
    return undefined
  }
}

function setSrvxAttributes(span: Span, data: SrvxRequestMessage) {
  const url = getSrvxUrl(data)
  if (!url) return

  setAttr(span, ATTR_HTTP_REQUEST_METHOD, data.request.method)
  setAttr(span, ATTR_URL_PATH, url.pathname)
  setAttr(span, ATTR_URL_SCHEME, url.protocol.replace(':', ''))
  setAttr(span, ATTR_NETWORK_PROTOCOL_NAME, 'http')
  setAttr(span, ATTR_CLIENT_ADDRESS, data.request.ip)
  setAttr(span, ATTR_SERVER_ADDRESS, url.hostname)
  setAttr(span, ATTR_SERVER_PORT, url.port)
  setAttr(span, ATTR_NETWORK_PEER_ADDRESS, data.request.ip)
  setAttr(span, ATTR_USER_AGENT_ORIGINAL, data.request.headers.get('User-Agent'))

  if (url.search) {
    setAttr(span, ATTR_URL_QUERY, url.search.substring(1))
  }

  if (data.request.runtime?.node) {
    setAttr(span, ATTR_NETWORK_PROTOCOL_VERSION, data.request.runtime.node.req.httpVersion)
    setAttr(span, ATTR_CLIENT_PORT, data.request.runtime.node.req.socket.remotePort)
    setAttr(span, ATTR_NETWORK_PEER_PORT, data.request.runtime.node.req.socket.remotePort)
  }
}

export function registerSrvxChannels(tracer: Tracer) {
  traceChannel<SrvxRequestMessage>('srvx.request', tracer, {
    skip(data) {
      const url = getSrvxUrl(data)
      return !url || isInternalRoute(url.pathname)
    },
    startUpdate(span, data) {
      const url = getSrvxUrl(data)
      if (!url) return
      // The srvx span wraps the whole request, so by the time it closes h3 has
      // populated `matchedRoute` on the shared request context. Prefer that route
      // template for a low-cardinality span name (OTEL HTTP semconv), matching the
      // `h3.request` span; fall back to the concrete path for unmatched requests
      // (static assets, 404s).
      const route = data.request.context?.matchedRoute?.route
      const target = route || url.pathname
      span.updateName(`${data.request.method} ${target}`)
      setSrvxAttributes(span, data)
      if (route) {
        setAttr(span, ATTR_HTTP_ROUTE, route)
      }
    },
    beforeEndUpdate(span, data) {
      if (!data.result) return
      const statusCode = data.result.status
      const statusText = data.result.statusText?.trim() ?? undefined
      setAttr(span, ATTR_HTTP_RESPONSE_STATUS_CODE, statusCode)
      span.setStatus(
        statusCode < 500
          ? { code: SpanStatusCode.OK, message: statusText }
          : { code: SpanStatusCode.ERROR, message: statusText },
      )
    },
  })

  traceChannel<SrvxMiddlewareMessage>('srvx.middleware', tracer, {
    skip(data) {
      const url = getSrvxUrl(data)
      return !url || isInternalRoute(url.pathname)
    },
    startUpdate(span, data) {
      const url = getSrvxUrl(data)
      if (!url) return
      span.updateName(`middleware ${data.request.method} ${url.pathname}`)
      span.updateName(`middleware ${data.request.method} ${url.pathname}`)
      setSrvxAttributes(span, data)
      setAttr(span, 'srvx.middleware.index', data.middleware.index)
    },
    beforeEndUpdate(span, data) {
      if (!data.result) return
      const statusCode = data.result.status
      const statusText = data.result.statusText?.trim() ?? undefined
      setAttr(span, ATTR_HTTP_RESPONSE_STATUS_CODE, statusCode)
      span.setStatus(
        statusCode < 500
          ? { code: SpanStatusCode.OK, message: statusText }
          : { code: SpanStatusCode.ERROR, message: statusText },
      )
    },
  })
}
