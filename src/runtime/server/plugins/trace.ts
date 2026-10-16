import { trace } from '@opentelemetry/api'
import { defineNitroPlugin } from 'nitropack/runtime'
import { nuxtOtel } from '#nuxt-otel-config'
import { registerH3Channels } from '../utils/h3.ts'
import { registerNuxtChannels } from '../utils/nuxt.ts'
import { registerSrvxChannels } from '../utils/srvx.ts'
import { registerUnstorageChannels } from '../utils/unstorage.ts'

export default defineNitroPlugin(() => {
  const tracer = trace.getTracer('nuxt-otel')

  if (nuxtOtel.nuxt) registerNuxtChannels(tracer)
  if (nuxtOtel.h3) registerH3Channels(tracer)
  if (nuxtOtel.srvx) registerSrvxChannels(tracer)
  if (nuxtOtel.unstorage) registerUnstorageChannels(tracer)
})
