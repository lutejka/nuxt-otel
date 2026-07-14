import { logs } from '@opentelemetry/api-logs'

export function useOtelLogger() {
  return logs.getLogger('nuxt-otel')
}
