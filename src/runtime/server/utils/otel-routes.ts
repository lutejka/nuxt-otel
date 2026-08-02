/** Shared prefix for all of the module's internal endpoints. */
export const INTERNAL_PREFIX = '/__nuxt-otel'

export const INGEST_PATH = `${INTERNAL_PREFIX}-ingest`
export const MCP_PATH = `${INTERNAL_PREFIX}-mcp`

export const UI_PATH = INTERNAL_PREFIX

/**
 * Returns `true` if the given request path matches one of the module's internal
 * endpoints (DevTools UI, OTLP ingest or MCP server). These endpoints should be
 * excluded from OpenTelemetry tracing to avoid circular spans and noise.
 */
export function isInternalRoute(path: string): boolean {
  return path.startsWith(INTERNAL_PREFIX)
}
