import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export class DevToolsOTLPTraceExporter extends OTLPTraceExporter {
  constructor() {
    super({
      url: globalThis.devServerUrl ? new URL('__opentelemetry-ingest', globalThis.devServerUrl).toString() : undefined,
    })
  }
}
