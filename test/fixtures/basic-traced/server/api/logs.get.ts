import { defineEventHandler } from 'h3'

type Logs = {
  body: unknown
  severityNumber: number | undefined
  severityText: string | undefined
  attributes: Record<string, unknown>
  eventName: string | undefined
}[]

export default defineEventHandler(() => {
  const exporter = globalThis.__otel_test_log_exporter
  if (!exporter) {
    return { logs: [] as Logs }
  }
  const records = exporter.getFinishedLogRecords()
  return {
    logs: records.map(r => ({
      body: r.body,
      severityNumber: r.severityNumber,
      severityText: r.severityText,
      attributes: r.attributes,
      eventName: r.eventName,
    })) as Logs,
  }
})
