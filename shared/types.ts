/**
 * Shared telemetry types for the client UI and the docs site.
 *
 * This is a plain source directory (not a published package). The published
 * module stays self-contained: it keeps its own copies of these shapes in
 * `src/runtime/otel/parse/parser.ts`.
 *
 * Keep the two in sync when changing the shape of `Trace`, `Span` or `Log`.
 */

export interface Span {
  span_id: string
  trace_id: string
  parent_span_id: string | null
  name: string
  kind: number
  start_time: number
  end_time: number
  duration: number
  status_code: number
  status_message: string | null
  attributes: Record<string, unknown>
  events: Array<{
    time: number
    name: string
    attributes: Record<string, unknown>
  }>
  links: Array<{
    traceId: string
    spanId: string
    traceState?: string
    attributes: Record<string, unknown>
  }>
}

export interface Trace {
  trace_id: string
  service_name: string
  operation_name: string
  start_time: number
  end_time: number
  duration: number
  status_code: number
  status_message: string | null
}

export interface Log {
  log_id: string
  timestamp: number
  trace_id: string | null
  span_id: string | null
  severity_number: number
  severity_text: string | null
  body: string
  service_name: string
  attributes: Record<string, unknown>
}
