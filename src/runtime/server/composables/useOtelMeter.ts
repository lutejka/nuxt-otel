import { metrics } from '@opentelemetry/api'

/**
 * Returns an OpenTelemetry meter for the given namespace. The global meter
 * provider is registered by the instrumentation preset (or by the host app
 * when `instrument: false`), so this always resolves to the active provider.
 *
 * @param namespace - Prefix used for the instrumentation scope name.
 */
export function useOtelMeter(namespace = 'nuxt-otel') {
  return metrics.getMeter(namespace)
}
