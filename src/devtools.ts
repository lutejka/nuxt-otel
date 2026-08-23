import { addCustomTab } from '@nuxt/devtools-kit'
import { existsSync } from 'node:fs'
import type { Nuxt } from '@nuxt/schema'
import { addDevServerHandler, type Resolver } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { eventHandler, getRequestURL, proxyRequest } from 'h3'
import { UI_PATH } from './runtime/server/utils/otel-routes'

export const DEVTOOLS_UI_ROUTE = UI_PATH
export const DEVTOOLS_UI_LOCAL_PORT = 3300

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver) {
  const clientPath = resolver.resolve('./client')
  const clientBuiltIndex = resolver.resolve('./client/index.html')
  const isProductionBuild = existsSync(clientBuiltIndex)

  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)
      server.middlewares.use(`${DEVTOOLS_UI_ROUTE}/`, sirv(clientPath, { dev: true, single: true }))
    })
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    addDevServerHandler({
      route: `${DEVTOOLS_UI_ROUTE}`,
      handler: eventHandler(async (e) => {
        const reqUrl = getRequestURL(e)
        const url = 'http://localhost:' + DEVTOOLS_UI_LOCAL_PORT + reqUrl.pathname + reqUrl.search
        return proxyRequest(e, url)
      }),
    })
  }

  addCustomTab(
    {
      name: 'nuxt-otel',
      title: 'OpenTelemetry',
      icon: 'simple-icons:opentelemetry',
      category: 'analyze',
      view: {
        type: 'iframe',
        src: joinURL(nuxt.options.app?.baseURL || '/', DEVTOOLS_UI_ROUTE),
      },
    },
    nuxt,
  )
}
