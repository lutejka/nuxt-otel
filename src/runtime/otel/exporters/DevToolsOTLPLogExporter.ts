import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'

export class DevToolsOTLPLogExporter extends OTLPLogExporter {
  constructor() {
    super({
      url: globalThis.devServerUrl ? new URL('__opentelemetry-ingest', globalThis.devServerUrl).toString() : undefined,
    })
  }
}
