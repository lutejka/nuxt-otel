import {
  defineNuxtModule,
  createResolver,
  addTypeTemplate,
  useLogger,
  addDevServerHandler,
  addServerImportsDir,
} from '@nuxt/kit'
import { pathToFileURL } from 'node:url'
import { eventHandler, readBody } from 'h3'
import { setupDevtools, getMcpEndpoint } from './devtools.ts'
import { INGEST_PATH } from './runtime/server/utils/otel-routes.ts'

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
  async setup(options, nuxt) {
    const logger = useLogger('nuxt-otel')

    if (!globalThis.process?.getBuiltinModule?.('node:diagnostics_channel')) {
      logger.warn('nuxt-otel: Diagnostics Channel is not available.')
      return
    }

    addTypeTemplate({
      filename: 'types/nuxt-otel.d.ts',
      getContents: () => `
        declare global {
          var devServerUrl: string | undefined
        }

        export {}`,
    })

    const resolver = createResolver(import.meta.url)

    addServerImportsDir(resolver.resolve('./runtime/server/composables'))

    if (nuxt.options.dev && nuxt.options.devtools && options.devtools) {
      const { ingest } = await setupDevtools(nuxt)
      addDevServerHandler({
        route: INGEST_PATH,
        handler: eventHandler(async (event) => {
          ingest(await readBody(event))
        }),
      })
      const mcpEndpoint = getMcpEndpoint(nuxt)
      const mcpLine = mcpEndpoint
        ? `\x1B[36m${mcpEndpoint}\x1B[39m`
        : 'disabled (`@devframes/agentic` is not installed)'
      logger.box(`Nuxt OTel devtools:
  OTLP HTTP ingest  → \x1B[36m${nuxt.options?.devServer?.url}${INGEST_PATH}\x1B[39m
  MCP server        → ${mcpLine}`)
    }

    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('rollup:before', async (_nitro, rollupConfig) => {
        // TODO use instrumentation fiel from hsot or preset
        const instrumentationsFile = pathToFileURL(await resolver.resolvePath('./runtime/server/instrument/preset/node')).href

        rollupConfig.output.entryFileNames = 'server.mjs'
        rollupConfig.plugins = [
          rollupConfig.plugins,
          {
            name: '@lutejka/nuxt-otel:entry',
            async generateBundle() {
              const channels = normalizeTracingChannel(nuxt.options.tracingChannel)
              const tracingChannels = [
                { enabled: channels.srvx, name: 'Srvx' },
                { enabled: channels.h3, name: 'H3' },
                { enabled: channels.nuxt, name: 'Nuxt' },
                { enabled: channels.unstorage, name: 'Unstorage' },
              ]

              this.emitFile({
                type: 'asset',
                fileName: 'index.mjs',
                source: [
                  // inline resolved option values directly into the bundle
                  `import { trace } from '@opentelemetry/api'`,
                  `import { registerH3Channels } from '${pathToFileURL(await resolver.resolvePath('./runtime/server/utils/h3.ts')).href}'`,
                  `import { registerNuxtChannels } from '${pathToFileURL(await resolver.resolvePath('./runtime/server/utils/nuxt.ts')).href}'`,
                  `import { registerSrvxChannels } from '${pathToFileURL(await resolver.resolvePath('./runtime/server/utils/srvx.ts')).href}'`,
                  `import { registerUnstorageChannels } from '${pathToFileURL(await resolver.resolvePath('./runtime/server/utils/unstorage.ts')).href}'`,
                  '',
                  `globalThis.devServerUrl = '${nuxt.options?.devServer?.url}'`,
                  '',
                  `const {default: start} = await import(${JSON.stringify(instrumentationsFile)})`,
                  `start(${JSON.stringify({ ...options, devtools: options.devtools && nuxt.options.dev })})`,
                  '',
                  `const tracer = trace.getTracer('nuxt-otel')`,
                  ...tracingChannels.map(({ enabled, name }) => {
                    if (!enabled) {
                      return ''
                    }
                    return `register${name}Channels(tracer)`
                  }),
                  '',
                  `await import('./server.mjs')`,
                  '',
                ].join('\n'),
              })
            },
          },
        ]
      })
    })
  },
})
