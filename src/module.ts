import { addServerImportsDir, addTypeTemplate, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { pathToFileURL } from 'node:url'
import { getMcpEndpoint, setupDevtools } from './devtools'
import type { ModuleOptions } from './runtime/otel/types'
import { INGEST_PATH } from './runtime/server/utils/otel-routes'

export interface TracingChannelOptions {
  nuxt?: boolean
  h3?: boolean
  srvx?: boolean
  unstorage?: boolean
}

export type { ModuleOptions }

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

const TRACING_CHANNELS = [
  { enabled: 'srvx' as const, name: 'Srvx', file: './runtime/server/utils/srvx' },
  { enabled: 'h3' as const, name: 'H3', file: './runtime/server/utils/h3' },
  { enabled: 'nuxt' as const, name: 'Nuxt', file: './runtime/server/utils/nuxt' },
  { enabled: 'unstorage' as const, name: 'Unstorage', file: './runtime/server/utils/unstorage' },
]

const VIRTUAL_BOOTSTRAP_ID = 'virtual:nuxt-otel-bootstrap'

/**
 * Nitro 3 serves the app in dev through a fixed `dev-entry.mjs` instead of
 * building `options.entry`. That module is loaded outside the normal
 * `resolveId` flow (only `load`/`transform` run), so entry matching happens in
 * `transform` and covers both the dev entry and the production entry.
 */
const NITRO_DEV_ENTRY_RE =
  /(?:^|[/\\])nitro(?:pack)?(?:-nightly)?[/\\]dist[/\\]runtime[/\\]internal[/\\]vite[/\\]dev-entry\.[cm]?[jt]s$/

interface EntryPluginContext {
  isEntry: (id: string) => boolean
  bootstrapSource: string
  registrationImports: string
  registrationSource: string
}

/**
 * A Vite/Rolldown plugin that wraps the Nitro server entry.
 *
 * The bootstrap is imported at the top of the entry (static imports are
 * evaluated in order, keeping the SDK ahead of the app) and the tracing
 * channels are registered at the end of the entry, once the app and any
 * host-provided tracer provider have loaded. The same plugin works for Nitro 2
 * (Nuxt 4) and Nitro 3 (Nuxt 5), in dev and in the build.
 */
function createEntryPlugin({ isEntry, bootstrapSource, registrationImports, registrationSource }: EntryPluginContext) {
  return {
    name: '@lutejka/nuxt-otel:entry',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === VIRTUAL_BOOTSTRAP_ID) {
        return `\0${VIRTUAL_BOOTSTRAP_ID}`
      }
    },
    load(id: string) {
      if (id === `\0${VIRTUAL_BOOTSTRAP_ID}`) {
        return bootstrapSource
      }
    },
    transform(code: string, id: string) {
      if (!isEntry(id)) {
        return
      }
      return {
        code: [
          `import ${JSON.stringify(VIRTUAL_BOOTSTRAP_ID)}`,
          registrationImports,
          code,
          registrationSource,
        ].join('\n'),
        map: null,
      }
    },
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

    // Nuxt only enables its own `nuxt.*` tracing channels when the option is an
    // object, so expand the `true` shorthand before Nuxt builds its config.
    if (nuxt.options.tracingChannel === true) {
      nuxt.options.tracingChannel = normalizeTracingChannel(true)
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
      // Serve the OTLP ingest endpoint from the Vite middleware stack. Nitro 3
      // does not mount Nitro dev handlers on the Vite dev server, and a plain
      // middleware works for Nitro 2 as well.
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
          req.on('data', chunk => chunks.push(chunk))
          req.on('end', () => {
            try {
              ingest(JSON.parse(Buffer.concat(chunks).toString('utf8')))
              res.statusCode = 204
            } catch {
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
  OTLP HTTP ingest  → \x1B[36m${nuxt.options?.devServer?.url}${INGEST_PATH}\x1B[39m
  MCP server        → ${mcpLine}`)
    }

    const instrumentEnabled = Boolean(options.instrument)
    const devtoolsEnabled = Boolean(options.devtools && nuxt.options.dev)
    const channels = normalizeTracingChannel(nuxt.options.tracingChannel)
    const enabledChannels = TRACING_CHANNELS.filter(({ enabled }) => channels[enabled])

    const runtimeFiles = await Promise.all(
      enabledChannels.map(async ({ name, file }) => ({
        name,
        path: await resolver.resolvePath(file),
      })),
    )
    const instrumentationsFile = instrumentEnabled
      ? await resolver.resolvePath('./runtime/server/instrument/preset/node')
      : undefined

    const startOptions = JSON.stringify({ ...options, devtools: devtoolsEnabled })
    const devServerUrl = JSON.stringify(nuxt.options.devServer?.url ?? '')

    /** Bundler ids are POSIX-style; keep Windows drive letters but drop `\`. */
    const fsPath = (path: string) => path.replace(/\\/g, '/')

    const instrumentationsPath = instrumentationsFile ? fsPath(instrumentationsFile) : undefined
    /**
     * In dev the preset is imported by path so the bundler resolves its
     * extensionless imports (it is source in the stub setup). In a build it
     * stays external and is loaded through a `file://` URL, so Nitro does not
     * inline the OTel dependency tree — the published runtime uses `.js`
     * specifiers, so no extension resolution is needed there.
     */
    const instrumentationsSpecifier = instrumentationsFile
      ? nuxt.options.dev ? instrumentationsPath : pathToFileURL(instrumentationsFile).href
      : undefined

    const registrationLines = enabledChannels.map(({ name }) => `register${name}Channels(tracer)`)

    /**
     * The bootstrap is imported first by the entry. Only start the built-in SDK
     * when instrumentation is enabled; otherwise the host app is expected to
     * register its own provider.
     */
    const bootstrapSource = [
      ...(devtoolsEnabled ? [`globalThis.devServerUrl = ${devServerUrl}`] : []),
      `if (!globalThis.__nuxtOtelStarted) {`,
      `  globalThis.__nuxtOtelStarted = true`,
      ...(instrumentEnabled
        ? [
          `  const { default: start } = await import(${JSON.stringify(instrumentationsSpecifier)})`,
          `  start(${startOptions})`,
        ]
        : []),
      `}`,
      '',
    ].join('\n')

    /**
     * Channel registration is appended to the entry body, after the app and its
     * plugins have loaded. The guard keeps HMR from subscribing twice.
     */
    const registrationSource = registrationLines.length === 0
      ? ''
      : [
        '',
        `if (!globalThis.__nuxtOtelTracingChannels) {`,
        `  globalThis.__nuxtOtelTracingChannels = true`,
        `  const tracer = trace.getTracer('nuxt-otel')`,
        ...enabledChannels.map(({ name }) => {
          return `  register${name}Channels(tracer)`
        }),
        `}`,
        '',
      ].join('\n')

    /**
     * Import the channel modules statically and only call them at the end of
     * the entry. A dynamic `await import()` here would run while the entry is
     * still evaluating; in builds where the entry is emitted into a chunk that
     * the channel modules import back (e.g. the Nitro runtime chunk on POSIX),
     * that top-level await deadlocks the server: it listens, but never answers.
     */
    const registrationImports = registrationLines.length === 0
      ? ''
      : [
        `import { trace } from '@opentelemetry/api'`,
        ...runtimeFiles.map(({ name, path }) => {
          return `import { register${name}Channels } from ${JSON.stringify(fsPath(path))}`
        }),
      ].join('\n')

    nuxt.hook('nitro:init', async (nitro) => {
      nitro.hooks.hook('rollup:before', async (_nitro, rollupConfig) => {
        const entryCandidates = new Set<string>()
        if (nitro.options.entry) {
          entryCandidates.add(nitro.options.entry)
          entryCandidates.add(fsPath(nitro.options.entry))
          const resolvedEntry = await resolver.resolvePath(nitro.options.entry, { cwd: nitro.options.rootDir })
          entryCandidates.add(resolvedEntry)
          entryCandidates.add(fsPath(resolvedEntry))
        }

        const isEntry = (id: string) => {
          const path = fsPath(id.split('?')[0]!)
          return entryCandidates.has(path) || NITRO_DEV_ENTRY_RE.test(path)
        }

        const plugin = createEntryPlugin({
          isEntry,
          bootstrapSource,
          registrationImports,
          registrationSource,
        })

        // In builds the preset stays out of the server bundle: its CJS
        // dependency tree is resolved next to the installed module instead of
        // being traced into the output.
        if (!nuxt.options.dev && instrumentationsSpecifier && instrumentationsFile) {
          const presetFiles = new Set([instrumentationsSpecifier, instrumentationsFile, fsPath(instrumentationsFile)])
          const isPreset = (id: string) => presetFiles.has(id) || presetFiles.has(fsPath(id.split('?')[0]!))
          const previousExternal = rollupConfig.external
          rollupConfig.external = ((id: string, ...args: unknown[]) => {
            if (isPreset(id)) {
              return true
            }
            if (typeof previousExternal === 'function') {
              return (previousExternal as (...args: unknown[]) => boolean | null | undefined)(id, ...args)
            }
            if (Array.isArray(previousExternal)) {
              return previousExternal.some((entry) => {
                return typeof entry === 'string' ? entry === id : entry instanceof RegExp ? entry.test(id) : false
              })
            }
            return false
          }) as typeof rollupConfig.external
        }

        rollupConfig.plugins = [...(rollupConfig.plugins ?? []), plugin]
      })
    })
  },
})
