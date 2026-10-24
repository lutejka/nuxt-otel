import { context, logs, propagation, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core'
import { InMemoryLogRecordExporter, LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { InMemorySpanExporter, SimpleSpanProcessor, TracerProvider } from '@opentelemetry/sdk-trace'
import { defineNitroPlugin } from 'nitropack/runtime'

declare global {
  var __otel_test_exporter: InMemorySpanExporter
  var __otel_test_log_exporter: InMemoryLogRecordExporter
}

const exporter = new InMemorySpanExporter()
const provider = new TracerProvider({
  spanProcessors: [new SimpleSpanProcessor({ exporter })],
})
trace.setGlobalTracerProvider(provider)
context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable())
propagation.setGlobalPropagator(
  new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  }),
)

globalThis.__otel_test_exporter = exporter

const logExporter = new InMemoryLogRecordExporter()
const loggerProvider = new LoggerProvider({
  processors: [new SimpleLogRecordProcessor({ exporter: logExporter })],
})
logs.setGlobalLoggerProvider(loggerProvider)

globalThis.__otel_test_log_exporter = logExporter

export default defineNitroPlugin(() => {})
