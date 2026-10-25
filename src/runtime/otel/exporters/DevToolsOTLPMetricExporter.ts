import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'

export class DevToolsOTLPMetricExporter extends OTLPMetricExporter {
  constructor() {
    super({
      url: globalThis.devServerUrl ? new URL('__opentelemetry-ingest', globalThis.devServerUrl).toString() : undefined,
    })
  }
}
