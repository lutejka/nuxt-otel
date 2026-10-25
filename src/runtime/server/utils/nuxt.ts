import type { NuxtIslandContext, NuxtRequestEvent, NuxtSSRContext } from '#app'
import { SpanStatusCode, type Tracer } from '@opentelemetry/api'
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_ROUTE,
  ATTR_NETWORK_PROTOCOL_NAME,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
} from '@opentelemetry/semantic-conventions'
import type { H3Event } from 'h3'
import { getResponseStatus } from 'h3'
import { isInternalRoute } from './otel-routes.ts'
import { isTracingSuppressed, setAttr, traceChannel } from './traceChannel.ts'

interface NuxtRequestMessage {
  event: NuxtRequestEvent
}

interface NuxtRenderMessage {
  event: H3Event
  ssrContext: NuxtSSRContext
  streaming?: boolean
}

interface NuxtIslandMessage {
  event: H3Event
  ssrContext: NuxtSSRContext
  islandContext: NuxtIslandContext
}

interface NuxtDataMessage {
  key: string
  functionName: string
}

interface NuxtPluginMessage {
  plugin: {
    name?: string
    parallel?: boolean
    dependsOn?: string[]
  }
}

export function registerNuxtChannels(tracer: Tracer) {
  traceChannel<NuxtRequestMessage>('nuxt.request', tracer, {
    skip(data) {
      return isTracingSuppressed() || isInternalRoute(data.event?.path ?? '')
    },
    startUpdate(span, data) {
      const event = data.event
      const path = event.path ?? ''
      const qIndex = path.indexOf('?')
      const pathname = qIndex === -1 ? path : path.slice(0, qIndex)
      const search = qIndex === -1 ? undefined : path.slice(qIndex + 1)
      const route = (event.context as Record<string, { route?: string } | undefined> | undefined)?.matchedRoute?.route

      span.updateName(`nuxt request ${pathname}`)
      setAttr(span, ATTR_HTTP_REQUEST_METHOD, event.method)
      setAttr(span, ATTR_URL_PATH, pathname)
      setAttr(span, ATTR_NETWORK_PROTOCOL_NAME, 'http')
      if (search) {
        setAttr(span, ATTR_URL_QUERY, search)
      }
      if (route) {
        setAttr(span, ATTR_HTTP_ROUTE, route)
      }
    },
    beforeEndUpdate(span, data) {
      if (!data.event.node) return
      const statusCode = getResponseStatus(data.event)
      setAttr(span, 'statusCode', statusCode)
      span.setStatus(statusCode < 500 ? { code: SpanStatusCode.OK } : { code: SpanStatusCode.ERROR })
    },
    errorUpdate() {},
  })

  traceChannel<NuxtRenderMessage>('nuxt.render', tracer, {
    skip(data) {
      return isTracingSuppressed() || isInternalRoute(data.ssrContext?.url ?? data.event?.path ?? '')
    },
    startUpdate(span, data) {
      span.updateName(`nuxt render ${data.ssrContext?.url ?? data.event?.path ?? ''}`)
      setAttr(span, 'url', data.ssrContext.url)
    },
    beforeEndUpdate(span, data) {
      if (!data.event.node) return
      const statusCode = getResponseStatus(data.event)
      setAttr(span, 'statusCode', statusCode)
      span.setStatus(statusCode < 500 ? { code: SpanStatusCode.OK } : { code: SpanStatusCode.ERROR })
    },
    errorUpdate() {},
  })

  traceChannel<NuxtIslandMessage>('nuxt.island', tracer, {
    skip(data) {
      return isTracingSuppressed() || isInternalRoute(data.event?.path ?? data.ssrContext?.url ?? '')
    },
    startUpdate(span, data) {
      span.updateName(`nuxt island ${data.islandContext.name ?? data.islandContext.id ?? ''}`)
      setAttr(span, 'component', data.islandContext.name)
      setAttr(span, 'id', data.islandContext.id)
    },
    beforeEndUpdate(span, data) {
      if (!data.event.node) return
      const statusCode = getResponseStatus(data.event)
      setAttr(span, 'statusCode', statusCode)
      span.setStatus(statusCode < 500 ? { code: SpanStatusCode.OK } : { code: SpanStatusCode.ERROR })
    },
  })

  traceChannel<NuxtDataMessage>('nuxt.data', tracer, {
    skip() {
      return isTracingSuppressed()
    },
    startUpdate(span, data) {
      span.updateName(`nuxt data ${data.key}`)
      setAttr(span, 'key', data.key)
      setAttr(span, 'functionName', data.functionName)
    },
  })

  traceChannel<NuxtPluginMessage>('nuxt.plugin', tracer, {
    skip() {
      return isTracingSuppressed()
    },
    startUpdate(span, data) {
      span.updateName(`nuxt plugin ${data.plugin.name || 'unknown'}`)
      setAttr(span, 'nuxt.plugin.name', data.plugin.name || 'unknown')
      setAttr(span, 'nuxt.plugin.parallel', !!data.plugin.parallel)
      setAttr(span, 'nuxt.plugin.dependsOn', data.plugin.dependsOn || [])
    },
  })
}
