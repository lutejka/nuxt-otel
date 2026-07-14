import { trace } from '@opentelemetry/api'
import { defineNitroPlugin } from 'nitropack/runtime'
import { nuxtOtel } from '#nuxt-otel-config'
import { registerH3Channels } from '../utils/h3'
import { registerNuxtChannels } from '../utils/nuxt'
import { registerSrvxChannels } from '../utils/srvx'
import { registerUnstorageChannels } from '../utils/unstorage'

export default defineNitroPlugin(() => {
  const tracer = trace.getTracer('nuxt-otel')

  if (nuxtOtel.nuxt) registerNuxtChannels(tracer)
  if (nuxtOtel.h3) registerH3Channels(tracer)
  if (nuxtOtel.srvx) registerSrvxChannels(tracer)
  if (nuxtOtel.unstorage) registerUnstorageChannels(tracer)
})
