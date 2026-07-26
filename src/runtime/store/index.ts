import type { OtelClientFunctions } from '~/src/types'
import type { Trace, Span, Log } from '../otel/parse/parser'

declare global {
  var __nuxtOtelTraces: Trace[] | undefined
  var __nuxtOtelSpans: Span[] | undefined
  var __nuxtOTelLogs: Log[] | undefined
  var __nuxtOtelRpcBroadcast: OtelClientFunctions | undefined
}

export function getTraces(): Trace[] {
  return globalThis.__nuxtOtelTraces || []
}

export function getSpans(traceId?: string): Span[] {
  const allSpans = globalThis.__nuxtOtelSpans ?? []
  return traceId ? allSpans.filter(s => s.trace_id === traceId) : allSpans
}

export function clearTraces(): void {
  if (globalThis.__nuxtOtelTraces) globalThis.__nuxtOtelTraces = []
  if (globalThis.__nuxtOtelSpans) globalThis.__nuxtOtelSpans = []
}

export function clearLogs() {
  globalThis.__nuxtOTelLogs = []
}

export function addSpans(spans: Span[]) {
  globalThis.__nuxtOtelSpans ||= []
  globalThis.__nuxtOtelSpans?.push(...spans)
  for (const span of spans) {
    globalThis.__nuxtOtelRpcBroadcast?.onSpanReceived(span)
  }
}

export function addTraces(traces: Trace[]) {
  globalThis.__nuxtOtelTraces ||= []
  globalThis.__nuxtOtelTraces?.push(...traces)
  for (const trace of traces) {
    globalThis.__nuxtOtelRpcBroadcast?.onTraceReceived(trace)
  }
}

export function addLogs(logs: Log[]) {
  globalThis.__nuxtOTelLogs ||= []
  globalThis.__nuxtOTelLogs.push(...logs)
  for (const log of logs) {
    globalThis.__nuxtOtelRpcBroadcast?.onLogReceived(log)
  }
}

export function getLogs(): Log[] {
  return globalThis.__nuxtOTelLogs || []
}
