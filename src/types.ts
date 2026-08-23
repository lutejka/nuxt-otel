import type { Trace, Log, Span } from './runtime/otel/parse/parser'

export interface OtelClientFunctions {
  onTracesReceived: (traces: Trace[]) => void
  onSpansReceived: (spans: Span[]) => void
  onLogsReceived: (logs: Log[]) => void
}

export interface OtelServerFunctions {
  getTraces: () => Trace[]
  getSpans: (traceId?: string) => Span[]
  clearTraces: () => void

  getLogs: () => Log[]

  clearLogs: () => void
}

export const RPC_NAMESPACE = 'nuxt-otel'
