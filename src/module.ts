import {
  defineNuxtModule,
  createResolver,
  addServerPlugin,
  addServerTemplate,
  useLogger,
  addDevServerHandler,
  addServerImportsDir,
} from '@nuxt/kit'
import { setupDevToolsUI } from './devtools/index'
import { setupRPC } from './rpc/index'
import { otlpIngestHandler } from './otel/ingest/otlpIngestHandler'
import { mcpHandler } from './rpc/mcp/index'

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

    if (nuxt.options.devtools && options.devtools) {
      addDevServerHandler({
        route: `/__nuxt-otel-ingest`,
        handler: otlpIngestHandler,
      })
      addDevServerHandler({
        route: `/__nuxt-otel-mcp`,
        handler: mcpHandler,
      })
      setupDevToolsUI(nuxt, resolver)
      setupRPC(nuxt)
    }

    nuxt.hook('nitro:config', (nitroConfig) => {
      if (options.instrument) {
        const { preset } = nitroConfig
        const nodeSdkPresets = ['node-server', 'node_server', 'nodeServer', 'node', 'bun']
        if (nodeSdkPresets.includes(preset!) || preset === undefined) {
          addServerPlugin(resolver.resolve('./runtime/server/plugins/instrument/node'))
        }
        else {
          logger.warn(
            `nuxt-otel currently only supports Node.js presets (node-server, bun) and the default preset. The "${preset}" preset is not supported — please instrument your app manually or set \`nuxtOtel: { instrument: false }\`.`,
          )
        }
      }
      addServerPlugin(resolver.resolve('./runtime/server/plugins/trace'))
    })
  },
})
