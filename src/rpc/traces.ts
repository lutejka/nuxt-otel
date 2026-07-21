import type { OtelServerFunctions } from '../runtime/core/rpc-types'
import { getTraces, getSpans, clearTraces, clearLogs, getLogs } from '../store/index'

export function setupTraceRPC(serverFunctions: OtelServerFunctions) {
  serverFunctions.getTraces = getTraces
  serverFunctions.getSpans = getSpans
  serverFunctions.clearTraces = clearTraces
  serverFunctions.clearLogs = clearLogs
  serverFunctions.getLogs = getLogs
}
