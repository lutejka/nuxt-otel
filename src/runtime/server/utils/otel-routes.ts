/**
 * OTLP HTTP ingest endpoint served by the dev server.
 *
 * Mirrors the default of `vite-opentelemetry-inspector` (`INGEST_PATH`),
 * which owns the OpenTelemetry panel in Vite DevTools (including the agent
 * tools previously served by the module's own MCP endpoint).
 */
export const INGEST_PATH = '/__opentelemetry-ingest'

/**
 * Returns `true` if the given request path matches one of the module's (or
 * the inspector's) internal endpoints. These endpoints should be excluded
 * from OpenTelemetry tracing to avoid circular spans and noise.
 */
export function isInternalRoute(path: string): boolean {
  return path.startsWith('/__opentelemetry') || path.startsWith('/__otel') || path.startsWith('/__nuxt-otel')
}
