import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import type { Trace, Span, Log } from '~~/types'
import { ref } from 'vue'

interface OtelServerFunctions {
  getTraces: () => Trace[]
  getSpans: (traceId?: string) => Span[]
  clearTraces: () => void
  getLogs: () => Log[]
  clearLogs: () => void
}

interface OtelClientFunctions {
  onTracesReceived: (traces: Trace[]) => void
  onSpansReceived: (spans: Span[]) => void
  onLogsReceived: (logs: Log[]) => void
}

interface Rpc {
  getTraces: () => Promise<Trace[]>
  getSpans: (traceId?: string) => Promise<Span[]>
  clearTraces: () => Promise<void>
  getLogs: () => Promise<Log[]>
  clearLogs: () => Promise<void>
}

let initialized = false

export default defineNuxtPlugin({
  name: 'rpc-connector',
  parallel: true,
  async setup() {
    const traces = useState<Trace[]>('traces', () => [])
    const spans = useState<Span[]>('spans', () => [])
    const logs = useState<Log[]>('logs', () => [])
    const rpc = ref<Rpc>()

    if (!initialized) {
      initialized = true

      onDevtoolsClientConnected((c) => {
        const clientRpc = c.devtools.extendClientRpc<OtelServerFunctions, OtelClientFunctions>('nuxt-otel', {
          onTracesReceived: (newTraces: Trace[]) => {
            // unshift in reverse to preserve chronological order
            for (let i = newTraces.length - 1; i >= 0; i--) {
              traces.value.unshift(newTraces[i])
            }
          },
          onSpansReceived: (newSpans: Span[]) => {
            spans.value.push(...newSpans)
          },
          onLogsReceived(newLogs) {
            logs.value.push(...newLogs)
          },
        })
        rpc.value = clientRpc

        Promise.allSettled([clientRpc.getTraces(), clientRpc.getSpans(), clientRpc.getLogs()])
          .then(([tracesResult, spansResult, logsResult]) => {
            traces.value = tracesResult.status === 'fulfilled' ? (tracesResult.value ?? []) : []
            spans.value = spansResult.status === 'fulfilled' ? (spansResult.value ?? []) : []
            logs.value = logsResult.status === 'fulfilled' ? (logsResult.value ?? []) : []
          })
          .catch((e) => {
            console.error('[nuxt-otel] Failed to load initial traces/spans:', e)
          })
      })
    }

    async function getSpansForTrace(traceId: string): Promise<Span[]> {
      if (rpc.value) {
        return await rpc.value.getSpans(traceId)
      }
      return spans.value.filter(s => s.trace_id === traceId)
    }

    async function clearAllTraces() {
      if (rpc.value) {
        await rpc.value.clearTraces()
      }
      traces.value = []
      spans.value = []
    }

    async function clearAllLogs() {
      if (rpc.value) {
        await rpc.value.clearLogs()
      }
      logs.value = []
    }

    return {
      provide: {
        traces,
        spans,
        logs,
        clearAllTraces,
        getSpansForTrace,
        clearAllLogs,
      },
    }
  },
})
