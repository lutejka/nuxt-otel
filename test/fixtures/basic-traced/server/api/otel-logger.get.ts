import { defineEventHandler } from 'h3'
import { SeverityNumber } from '@opentelemetry/api-logs'
import { useOtelLogger } from '../../../../../src/runtime/server/composables/useOtelLogger'

export default defineEventHandler(() => {
  const logger = useOtelLogger()
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    body: 'hello from otel logger',
    attributes: { key: 'value' },
  })
  return { logged: true }
})
