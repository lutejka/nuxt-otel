import type { Trace, Span, Log } from '../../otel/parse/parser'

export interface OtelClientFunctions {
  onTraceReceived: (trace: Trace) => void
  onSpanReceived: (span: Span) => void
  onLogReceived: (log: Log) => void
}

export interface OtelServerFunctions {
  getTraces: () => Trace[]
  getSpans: (traceId?: string) => Span[]
  clearTraces: () => void

  getLogs: () => Log[]

  clearLogs: () => void
}

export const RPC_NAMESPACE = 'nuxt-otel'
