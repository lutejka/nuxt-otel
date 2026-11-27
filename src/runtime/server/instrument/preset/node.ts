import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { defineInstrumentation } from '../../../otel/defineInstrumentation'
import { DevToolsOTLPLogExporter } from '../../../otel/exporters/DevToolsOTLPLogExporter'
import { DevToolsOTLPMetricExporter } from '../../../otel/exporters/DevToolsOTLPMetricExporter'
import { DevToolsOTLPTraceExporter } from '../../../otel/exporters/DevToolsOTLPTraceExporter'
import type { ModuleOptions } from '../../../otel/types'
import { isInternalRoute } from '../../utils/otel-routes'

/**
 * Check whether a request pathname matches any of the user-provided ignore
 * patterns (strings or RegExp). Strings are matched as prefixes.
 */
function matchesIgnorePaths(pathname: string, patterns: (string | RegExp)[] | undefined): boolean {
  if (!patterns || patterns.length === 0) {
    return false
  }
  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return pathname.startsWith(pattern)
    }
    return pattern.test(pathname)
  })
}

export default defineInstrumentation((options: ModuleOptions) => {
  const {
    devtools: devtoolsEnabled,
    headersToSpanAttributes,
    redactedQueryParamsServer,
    redactedQueryParams,
    ignoreRequestPaths,
    ignoreRequest,
  } = options
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
          return isInternalRoute(request.url ?? '') || matchesIgnorePaths(request.url ?? '', ignoreRequestPaths)
            || (ignoreRequest?.(request) ?? false)
        },
        ignoreOutgoingRequestHook: (requestOptions) => {
          return isInternalRoute(requestOptions.path ?? '')
            || matchesIgnorePaths(requestOptions.path ?? '', ignoreRequestPaths)
            || (ignoreRequest?.(requestOptions as unknown as Parameters<typeof ignoreRequest>[0]) ?? false)
        },
        ...(headersToSpanAttributes ? { headersToSpanAttributes } : {}),
        ...(redactedQueryParamsServer ? { redactedQueryParamsServer } : {}),
      },
      '@opentelemetry/instrumentation-undici': {
        ignoreRequestHook: (request) => {
          return isInternalRoute(request.path) || matchesIgnorePaths(request.path, ignoreRequestPaths)
            || (ignoreRequest?.(request as unknown as Parameters<typeof ignoreRequest>[0]) ?? false)
        },
        ...(headersToSpanAttributes?.client ? { headersToSpanAttributes: headersToSpanAttributes.client } : {}),
        ...(redactedQueryParams ? { redactedQueryParams } : {}),
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
