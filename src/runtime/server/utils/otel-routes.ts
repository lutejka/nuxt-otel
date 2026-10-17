/**
 * OTLP HTTP ingest endpoint served by the dev server.
 *
 * Mirrors the default of `vite-opentelemetry-inspector` (`INGEST_PATH`),
 * which owns the OpenTelemetry panel in Vite DevTools (including the agent
 * tools previously served by the module's own MCP endpoint).
 */
export const INGEST_PATH = '/__opentelemetry-ingest'

/** Normalize an absolute URL or path (dropping query/hash) down to a pathname. */
export function getPathname(input: string | undefined): string {
  if (!input) {
    return ''
  }

  let pathname = input

  // Strip `scheme://host` when an absolute URL was passed.
  const schemeIndex = pathname.indexOf('://')
  if (schemeIndex !== -1) {
    const rest = pathname.slice(schemeIndex + 3)
    const slashIndex = rest.indexOf('/')
    pathname = slashIndex === -1 ? '/' : rest.slice(slashIndex)
  }

  const queryIndex = pathname.indexOf('?')
  if (queryIndex !== -1) {
    pathname = pathname.slice(0, queryIndex)
  }

  const hashIndex = pathname.indexOf('#')
  if (hashIndex !== -1) {
    pathname = pathname.slice(0, hashIndex)
  }

  return pathname
}

/**
 * Returns `true` if the given request path (or absolute URL) matches one of the
 * module's (or the inspector's) internal endpoints. These endpoints should be
 * excluded from OpenTelemetry tracing to avoid circular spans and noise.
 *
 * Dev-only: those endpoints exist solely on the dev server, and the generated
 * entry inlines `globalThis.devServerUrl` only when devtools are enabled. In
 * production the global stays `undefined`, so this short-circuits on the first
 * check and the whole suppression path is statically dead code.
 */
export function isInternalRoute(input: string | undefined): boolean {
  const pathname = getPathname(input)
  return (
    pathname.startsWith('/__opentelemetry') || pathname.startsWith('/__otel') || pathname.startsWith('/__nuxt-otel')
  )
}
