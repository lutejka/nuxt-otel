import {
  defineNuxtModule,
  createResolver,
  addServerPlugin,
  addServerTemplate,
  useLogger,
  addDevServerHandler,
  addServerImportsDir,
} from '@nuxt/kit'
import { setupDevToolsUI } from './devtools'
import { setupRPC } from './runtime/rpc/index'
import { otlpIngestHandler } from './runtime/otel/ingest/otlpIngestHandler'
import { mcpHandler } from './runtime/mcp/index'

// Include type augmentations in the published types
import './types'
import { INGEST_PATH, MCP_PATH } from './runtime/server/utils/otel-routes'

export interface TracingChannelOptions {
  nuxt?: boolean
  h3?: boolean
  srvx?: boolean
  unstorage?: boolean
}

export interface ModuleOptions {
  instrument: boolean
  devtools?: boolean
}

export function normalizeTracingChannel(val: boolean | TracingChannelOptions | undefined): TracingChannelOptions {
  if (val === true) {
    return { nuxt: true, h3: true, srvx: true, unstorage: true }
  }
  if (val === false || val === undefined) {
    return { nuxt: false, h3: false, srvx: false, unstorage: false }
  }
  return {
    nuxt: val.nuxt ?? true,
    h3: val.h3 ?? true,
    srvx: val.srvx ?? true,
    unstorage: val.unstorage ?? true,
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-otel',
    configKey: 'nuxtOtel',
    version: '>=4.5.0',
  },
  defaults: {
    instrument: true,
    devtools: true,
  },
  setup(options, nuxt) {
    const logger = useLogger('nuxt-otel')

    if (!globalThis.process?.getBuiltinModule?.('node:diagnostics_channel')) {
      logger.warn('nuxt-otel: Diagnostics Channel is not available.')
      return
    }
    const channels = normalizeTracingChannel(nuxt.options.tracingChannel)
    const devServerUrl = nuxt.options?.devServer?.url

    addServerTemplate({
      filename: '#nuxt-otel-config',
      getContents: () => {
        const devServerUrl = nuxt.options?.devServer?.url ? `'${nuxt.options?.devServer?.url}'` : 'undefined'
        return `
        export const nuxtOtel = ${JSON.stringify(channels)}
        export const devtoolsEnabled = ${options.devtools || false}
        export const devServerUrl = ${devServerUrl}
        `
      },
    })

    const resolver = createResolver(import.meta.url)

    addServerImportsDir(resolver.resolve('./runtime/server/composables'))

    if (nuxt.options.dev && nuxt.options.devtools && options.devtools) {
      addDevServerHandler({
        route: INGEST_PATH,
        handler: otlpIngestHandler,
      })
      addDevServerHandler({
        route: MCP_PATH,
        handler: mcpHandler,
      })
      logger.box(`Nuxt OTel  endpoints:
  OTLP HTTP ingest  → \x1B[36m${devServerUrl}${INGEST_PATH}\x1B[39m
  MCP server        → \x1B[36m${devServerUrl}${MCP_PATH}\x1B[39m`)
      setupDevToolsUI(nuxt, resolver)
      setupRPC(nuxt)
    }

    nuxt.hook('nitro:config', (nitroConfig) => {
      if (options.instrument) {
        const { preset } = nitroConfig
        const nodeSdkPresets = ['node-server', 'node_server', 'nodeServer', 'node', 'bun']
        if (nodeSdkPresets.includes(preset!) || preset === undefined) {
          addServerPlugin(resolver.resolve('./runtime/server/plugins/instrument/node'))
        } else {
          logger.warn(
            `nuxt-otel currently only supports Node.js presets (node-server, bun) and the default preset. The "${preset}" preset is not supported — please instrument your app manually or set \`nuxtOtel: { instrument: false }\`.`,
          )
        }
      }
      addServerPlugin(resolver.resolve('./runtime/server/plugins/trace'))
    })
  },
})
