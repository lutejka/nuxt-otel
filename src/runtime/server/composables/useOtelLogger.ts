import { logs } from '@opentelemetry/api'

export function useOtelLogger() {
  return logs.getLogger('nuxt-otel')
}
