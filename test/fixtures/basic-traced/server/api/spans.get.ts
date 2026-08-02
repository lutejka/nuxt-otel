import { defineEventHandler } from 'h3'

type Spans = {
  name: string
  attributes: Record<string, unknown>
  status: { code: number }
  kind: number
}[]

export default defineEventHandler(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exporter = (globalThis as any).__otel_test_exporter
  if (!exporter) {
    return { spans: [] as Spans }
  }
  const spans = exporter.getFinishedSpans()
  return {
    spans: spans.map(
      (s: { name: string; attributes: Record<string, unknown>; status: { code: number }; kind: number }) => ({
        name: s.name,
        attributes: s.attributes,
        status: s.status,
        kind: s.kind,
      }),
    ) as Spans,
  }
})
