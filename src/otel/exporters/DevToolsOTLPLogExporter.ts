import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { devServerUrl } from '#nuxt-otel-config'

export class DevToolsOTLPLogExporter extends OTLPLogExporter {
  constructor() {
    super({
      url: devServerUrl ? new URL('__nuxt-otel-ingest', devServerUrl).toString() : undefined,
    })
  }
}
