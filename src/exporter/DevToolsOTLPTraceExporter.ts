import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { devServerUrl } from '#nuxt-otel-config'

export class DevToolsOTLPTraceExporter extends OTLPTraceExporter {
  constructor() {
    super({
      url: devServerUrl ? new URL('__nuxt-otel-ingest', devServerUrl).toString() : undefined,
    })
  }
}
