import fakeData from '../../fake-data/traces.json'
import type { Trace, Span, Log } from '~~/types'

export default defineNuxtPlugin(() => {
  const traces = useState<Trace[]>('traces', () => (fakeData.traces as Trace[]).map((t) => ({ ...t })))
  const spans = useState<Span[]>('spans', () => (fakeData.spans as Span[]).map((s) => ({ ...s })))
  const logs = useState<Log[]>('logs', () => (fakeData.logs as Log[]).map((l) => ({ ...l })))

  function getSpansForTrace(traceId: string): Span[] {
    return spans.value.filter((s) => s.trace_id === traceId)
  }

  function clearAllTraces() {
    traces.value = []
    spans.value = []
  }

  function clearAllLogs() {
    logs.value = []
  }

  return {
    provide: {
      traces,
      spans,
      logs,
      getSpansForTrace,
      clearAllTraces,
      clearAllLogs,
    },
  }
})
