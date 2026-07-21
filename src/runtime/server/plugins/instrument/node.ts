import { NodeSDK } from '@opentelemetry/sdk-node'
import { defineNitroPlugin } from 'nitropack/runtime'
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { devtoolsEnabled } from '#nuxt-otel-config'
import { DevToolsOTLPTraceExporter } from '../../../../otel/exporters/DevToolsOTLPTraceExporter'
import { DevToolsOTLPLogExporter } from '../../../../otel/exporters/DevToolsOTLPLogExporter'

export default defineNitroPlugin(() => {
  const sdk = new NodeSDK({
    traceExporter: devtoolsEnabled ? new DevToolsOTLPTraceExporter() : undefined,
    logRecordProcessors: devtoolsEnabled
      ? [new SimpleLogRecordProcessor({ exporter: new DevToolsOTLPLogExporter() })]
      : [],
  })
  sdk.start()
})
