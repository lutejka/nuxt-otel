import { SpanStatusCode } from '@opentelemetry/api'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const { trace } = useOtelTracer('middleware')

  await trace('test', async (span) => {
    const path = event.path
    const logger = useOtelLogger()
    logger.emit({ severityNumber: 9, body: `middleware processing ${path}`, attributes: { path } })
    span.setStatus({ code: SpanStatusCode.OK })
  })
})
