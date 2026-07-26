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
  const existingIds = new Set(globalThis.__nuxtOtelSpans!.map(s => s.span_id))
  const newSpans = spans.filter(s => !existingIds.has(s.span_id))
  if (newSpans.length === 0) return
  globalThis.__nuxtOtelSpans!.push(...newSpans)
  globalThis.__nuxtOtelRpcBroadcast?.onSpansReceived(newSpans)
}

export function addTraces(traces: Trace[]) {
  globalThis.__nuxtOtelTraces ||= []
  const existingIds = new Set(globalThis.__nuxtOtelTraces!.map(t => t.trace_id))
  const newTraces = traces.filter(t => !existingIds.has(t.trace_id))
  if (newTraces.length === 0) return
  globalThis.__nuxtOtelTraces!.push(...newTraces)
  globalThis.__nuxtOtelRpcBroadcast?.onTracesReceived(newTraces)
}

export function addLogs(logs: Log[]) {
  globalThis.__nuxtOTelLogs ||= []
  const existingIds = new Set(globalThis.__nuxtOTelLogs!.map(l => l.log_id))
  const newLogs = logs.filter(l => !existingIds.has(l.log_id))
  if (newLogs.length === 0) return
  globalThis.__nuxtOTelLogs!.push(...newLogs)
  globalThis.__nuxtOtelRpcBroadcast?.onLogsReceived(newLogs)
}

export function getLogs(): Log[] {
  return globalThis.__nuxtOTelLogs || []
}
