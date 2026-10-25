import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { DevToolsOTLPLogExporter } from '../../../otel//exporters/DevToolsOTLPLogExporter.ts'
import { DevToolsOTLPMetricExporter } from '../../../otel//exporters/DevToolsOTLPMetricExporter.ts'
import { DevToolsOTLPTraceExporter } from '../../../otel//exporters/DevToolsOTLPTraceExporter.ts'
import { defineInstrumentation } from '../../../otel/defineInstrumentation.ts'
import { isInternalRoute } from '../../utils/otel-routes.ts'

export default defineInstrumentation((options) => {
  const { devtools: devtoolsEnabled } = options
  const sdk = new NodeSDK({
    traceExporter: devtoolsEnabled ? new DevToolsOTLPTraceExporter() : undefined,
    logRecordProcessors: devtoolsEnabled
      ? [new SimpleLogRecordProcessor({ exporter: new DevToolsOTLPLogExporter() })]
      : undefined,
    // The devtools panel is a live UI, so export more often than the 60s default.
    metricReaders: devtoolsEnabled
      ? [new PeriodicExportingMetricReader({ exporter: new DevToolsOTLPMetricExporter(), exportIntervalMillis: 5000 })]
      : undefined,
    instrumentations: getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (request) => {
          return isInternalRoute(request.url ?? '')
        },
        ignoreOutgoingRequestHook: (requestOptions) => {
          return isInternalRoute(requestOptions.path ?? '')
        },
      },
      '@opentelemetry/instrumentation-undici': {
        ignoreRequestHook: (request) => {
          return isInternalRoute(request.path)
        },
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-ioredis': {
        enabled: true,
      },
    }),
  })
  sdk.start()
})
