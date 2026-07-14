import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { LoggerProvider, SimpleLogRecordProcessor, InMemoryLogRecordExporter } from '@opentelemetry/sdk-logs'
import { logs } from '@opentelemetry/api-logs'
import { defineNitroPlugin } from 'nitropack/runtime'

declare global {
  var __otel_test_exporter: InMemorySpanExporter
  var __otel_test_log_exporter: InMemoryLogRecordExporter
}

const exporter = new InMemorySpanExporter()
const provider = new NodeTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)],
})
provider.register()

globalThis.__otel_test_exporter = exporter

const logExporter = new InMemoryLogRecordExporter()
const loggerProvider = new LoggerProvider({
  processors: [new SimpleLogRecordProcessor({ exporter: logExporter })],
})
logs.setGlobalLoggerProvider(loggerProvider)

globalThis.__otel_test_log_exporter = logExporter

export default defineNitroPlugin(() => {})
