import type { NuxtSSRContext, NuxtIslandContext } from '#app'
import { SpanStatusCode, type Tracer } from '@opentelemetry/api'
import type { H3Event } from 'h3'
import { getResponseStatus } from 'h3'
import { traceChannel, setAttr } from './traceChannel'

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
  traceChannel<NuxtRenderMessage>('nuxt.render', tracer, {
    startUpdate(span, data) {
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
    startUpdate(span, data) {
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
    startUpdate(span, data) {
      span.updateName(`nuxt.data ${data.key}`)
      setAttr(span, 'key', data.key)
      setAttr(span, 'functionName', data.functionName)
    },
  })

  traceChannel<NuxtPluginMessage>('nuxt.plugin', tracer, {
    startUpdate(span, data) {
      span.updateName(`nuxt.plugin ${data.plugin.name || 'unknown'}`)
      setAttr(span, 'nuxt.plugin.name', data.plugin.name || 'unknown')
      setAttr(span, 'nuxt.plugin.parallel', !!data.plugin.parallel)
      setAttr(span, 'nuxt.plugin.dependsOn', data.plugin.dependsOn || [])
    },
  })
}
