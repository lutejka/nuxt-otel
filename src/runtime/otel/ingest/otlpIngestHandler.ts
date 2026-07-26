import { eventHandler, readBody } from 'h3'
import { parseOTLPLog, parseOTLPTrace } from '../parse/parser'
import { addLogs, addSpans, addTraces } from '../../store/index'

export const otlpIngestHandler = eventHandler(async (event) => {
  const body = await readBody(event)
  if (body?.resourceSpans) {
    const { spans: newSpans, traces: newTraces } = parseOTLPTrace(body)
    addTraces(newTraces)
    addSpans(newSpans)
  }
  if (body.resourceLogs) {
    const { logs } = parseOTLPLog(body)
    addLogs(logs)
  }
})
