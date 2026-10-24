import type { Nuxt } from '@nuxt/schema'
import type { DevframeDefinition } from 'devframe'
import { createRequire } from 'node:module'
import { joinURL } from 'ufo'

const DEVTOOLS_ID = 'opentelemetry'
const DEVTOOLS_TITLE = 'OpenTelemetry'
const DEVTOOLS_ICON = 'simple-icons:opentelemetry'

interface DevtoolsReadyContext {
  install: (definition: DevframeDefinition, options?: { dock?: Record<string, unknown> }) => unknown
}

interface LegacyCustomTab {
  name: string
  title: string
  icon: string
  category: 'analyze'
  view: { type: 'iframe'; src: string }
}

type Hook = <T extends unknown[]>(name: string, fn: (...args: T) => unknown) => void

/** Nuxt DevTools v4 exposes the Vite DevTools context on `nuxt.devtools`; v3 does not. */
function isViteDevtools(nuxt: Nuxt) {
  const devtools = (nuxt as Nuxt & { devtools?: object }).devtools
  return !!devtools && 'devtoolsKit' in devtools
}

/** Base path the devframe UI is served from (iframe tab `src`). */
export function getDevtoolsBase(nuxt: Nuxt) {
  return joinURL(nuxt.options.app.baseURL || '/', `/__${DEVTOOLS_ID}/`)
}

/**
 * MCP endpoint auto-mounted by `initDevframe` at `<base>__mcp`, or `undefined`
 * when the optional `@devframes/agentic` peer is not installed (devframe then
 * logs DF0078 and serves no MCP endpoint).
 */
export function getMcpEndpoint(nuxt: Nuxt): string | undefined {
  try {
    createRequire(import.meta.url).resolve('@devframes/agentic')
  } catch {
    return undefined
  }
  const devServerUrl = (nuxt.options?.devServer?.url || '').replace(/\/$/, '')
  return `${devServerUrl}${joinURL(getDevtoolsBase(nuxt), '__mcp')}`
}

/**
 * Mount the `vite-opentelemetry-inspector` devframe: natively in Vite
 * DevTools via `devtools:ready`, or — on older Nuxt DevTools without a
 * devframe host — as an iframe tab serving the devframe locally.
 */
export async function setupDevtools(nuxt: Nuxt) {
  const { createOpentelemetryDevframe } = await import('vite-opentelemetry-inspector/devtools')
  const { definition, ingest } = createOpentelemetryDevframe({
    id: DEVTOOLS_ID,
    name: DEVTOOLS_TITLE,
    icon: DEVTOOLS_ICON,
  })

  const hook = nuxt.hook as Hook

  hook('devtools:ready', (ctx: DevtoolsReadyContext) => {
    console.log('REDY')
    return ctx.install(definition, {
      dock: { groupId: 'nuxt', category: 'analyze' },
    })
  })

  let legacyDevtools = false
  hook('devtools:initialized', () => {
    legacyDevtools = !isViteDevtools(nuxt)
  })

  const base = getDevtoolsBase(nuxt)

  hook('devtools:customTabs', (tabs: LegacyCustomTab[]) => {
    if (legacyDevtools) {
      tabs.push({
        name: DEVTOOLS_ID,
        title: DEVTOOLS_TITLE,
        icon: DEVTOOLS_ICON,
        category: 'analyze',
        view: { type: 'iframe', src: base },
      })
    }
  })

  let instance: { close: () => Promise<void> } | undefined
  nuxt.hook('close', () => instance?.close())
  nuxt.hook('vite:serverCreated', async (server, { isClient }) => {
    if (!isClient || !legacyDevtools) {
      return
    }
    await instance?.close()
    const { initDevframe } = await import('devframe/initiate')
    const created = initDevframe(definition, { base: '/', ws: false, auth: false })
    server.middlewares.use(base, created.nodeMiddleware)
    instance = created
  })

  return { ingest }
}
