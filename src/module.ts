import {
  addServerImportsDir,
  addTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, relative } from 'node:path'
import { setupDevtools, getMcpEndpoint } from './devtools.ts'
import { INGEST_PATH } from './runtime/server/utils/otel-routes.ts'

/** Express `toFile` as a relative import specifier from the generated bootstrap. */
function toRelativeImport(fromDir: string, toFile: string): string {
  const rel = relative(fromDir, toFile).replace(/\\/g, '/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

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

    const resolver = createResolver(import.meta.url)

    addTypeTemplate({
      filename: 'types/nuxt-otel.d.ts',
      getContents: () => `declare global {
  var devServerUrl: string | undefined
}

export {}`,
    })

    addServerImportsDir(resolver.resolve('./runtime/server/composables'))

    const isDev = Boolean(nuxt.options.dev)
    const devtoolsEnabled = isDev && Boolean(nuxt.options.devtools && options.devtools)
    const channels = normalizeTracingChannel(nuxt.options.tracingChannel)

    // Resolve a runtime file to a relative specifier the generated bootstrap can import.
    // Relative (not `file://`) specifiers are the ones both Nitro bundlers follow, and
    // extensionless on purpose: the published module ships `.js`, the source `.ts`.
    // `bootstrapDir` is filled in right after `addTemplate`; `getContents` runs later.
    let bootstrapDir = nuxt.options.buildDir
    const runtime = async (path: string) => toRelativeImport(bootstrapDir, await resolver.resolvePath(path))

    // A single bootstrap, wired as a Nitro plugin, covers Nuxt 4 (Nitro 2) and Nuxt 5
    // (Nitro 3), in dev and in the build — no more separate dev/build entry wrappers.
    const bootstrap = addTemplate({
      filename: 'nuxt-otel/instrument.mjs',
      write: true,
      getContents: async () => {
        const imports = [`import { trace } from '@opentelemetry/api'`]
        const registrations: string[] = []

        if (channels.nuxt) {
          imports.push(`import { registerNuxtChannels } from ${JSON.stringify(await runtime('./runtime/server/utils/nuxt'))}`)
          registrations.push(`registerNuxtChannels(tracer)`)
        }
        if (channels.h3) {
          imports.push(`import { registerH3Channels } from ${JSON.stringify(await runtime('./runtime/server/utils/h3'))}`)
          registrations.push(`registerH3Channels(tracer)`)
        }
        if (channels.srvx) {
          imports.push(`import { registerSrvxChannels } from ${JSON.stringify(await runtime('./runtime/server/utils/srvx'))}`)
          registrations.push(`registerSrvxChannels(tracer)`)
        }
        if (channels.unstorage) {
          imports.push(`import { registerUnstorageChannels } from ${JSON.stringify(await runtime('./runtime/server/utils/unstorage'))}`)
          registrations.push(`registerUnstorageChannels(tracer)`)
        }
        if (isDev) {
          imports.push(`import { installRequestRootSpan } from ${JSON.stringify(await runtime('./runtime/server/utils/requestRootSpan'))}`)
        }

        const lines = [...imports, '']

        // The devtools exporters read `globalThis.devServerUrl`, so it has to be set
        // before the SDK (and with it, the exporters) is imported below.
        if (devtoolsEnabled) {
          lines.push(`globalThis.devServerUrl = ${JSON.stringify(nuxt.options.devServer?.url)}`, '')
        }

        // Starting the SDK at module top level (before the server handlers are
        // imported) is what keeps the auto instrumentations ahead of the app code
        // they patch — the reason instrumentation used to be wrapped around the
        // built entry instead.
        if (options.instrument) {
          lines.push(
            `const { default: start } = await import(${JSON.stringify(await runtime('./runtime/server/instrument/preset/node'))})`,
            `await start(${JSON.stringify({ instrument: options.instrument, devtools: devtoolsEnabled })})`,
            '',
          )
        }

        // Channels subscribe from the plugin body, not module scope: Nitro calls all
        // plugin functions only after every plugin module has been imported, so an
        // app (or preset) that registers its own tracer provider has installed the
        // OpenTelemetry context manager by then. Subscribing earlier would bind the
        // channels to a missing async-local-storage store and silently drop nesting.
        lines.push(
          `export default function nuxtOtelPlugin (nitroApp) {`,
          `  const tracer = trace.getTracer('nuxt-otel')`,
          ...registrations.map(line => `  ${line}`),
          // Dev-only: the production server emits `srvx.request` as the trace root,
          // but the Nuxt 5 / Vite dev server never runs Nitro's srvx producers, so
          // without this each h3 channel span would become its own trace root.
          ...(isDev ? [`  installRequestRootSpan(nitroApp, tracer)`] : []),
          `}`,
          '',
        )

        return lines.join('\n')
      },
    })
    bootstrapDir = dirname(bootstrap.dst)
    // Append straight onto the Nitro config. The kit's `addServerPlugin` routes through a
    // per-major variant registry that a Nuxt 4 host does not read back, so the bootstrap
    // would silently be dropped there.
    nuxt.options.nitro.plugins ||= []
    nuxt.options.nitro.plugins.push(bootstrap.dst)

    if (devtoolsEnabled) {
      const { ingest } = await setupDevtools(nuxt)

      // Serve the OTLP ingest endpoint straight from the Vite dev server: a plain
      // connect middleware works on both Nuxt 4 and Nuxt 5, and avoids h3 handlers,
      // which are not compatible with the srvx request objects of the Nuxt 5 dev
      // server.
      nuxt.hook('vite:serverCreated', (server, { isClient }) => {
        if (!isClient) {
          return
        }
        server.middlewares.use(INGEST_PATH, (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end()
            return
          }
          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            try {
              ingest(JSON.parse(Buffer.concat(chunks).toString('utf8')))
              res.statusCode = 204
            }
            catch {
              res.statusCode = 400
            }
            res.end()
          })
        })
      })

      const mcpEndpoint = getMcpEndpoint(nuxt)
      const mcpLine = mcpEndpoint
        ? `\x1B[36m${mcpEndpoint}\x1B[39m`
        : 'disabled (`@devframes/agentic` is not installed)'
      logger.box(`Nuxt OTel devtools:
  OTLP HTTP ingest  → \x1B[36m${nuxt.options.devServer?.url}${INGEST_PATH}\x1B[39m
  MCP server        → ${mcpLine}`)
    }
  },
})
