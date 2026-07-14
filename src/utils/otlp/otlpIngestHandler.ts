import { eventHandler, readBody } from 'h3'
import { parseOTLPLog, parseOTLPTrace } from './parser'
import { addLogs, addSpans, addTraces } from '../../server-rpc/traces'

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
