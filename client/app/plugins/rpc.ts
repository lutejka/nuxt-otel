import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import type { Trace, Span, Log } from '~shared/types'
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
    const rpc = ref<Rpc | null>(null)
    const isConnected = ref(false)

    if (!initialized) {
      initialized = true

      onDevtoolsClientConnected((c) => {
        // Reset connection state when (re)connecting
        isConnected.value = false
        rpc.value = null

        let clientRpc: Rpc
        try {
          clientRpc = c.devtools.extendClientRpc<OtelServerFunctions, OtelClientFunctions>('nuxt-otel', {
            onTracesReceived: (newTraces: Trace[]) => {
              if (!newTraces?.length) return
              // unshift in reverse to preserve chronological order
              for (let i = newTraces.length - 1; i >= 0; i--) {
                const trace = newTraces[i]
                if (trace) traces.value.unshift(trace)
              }
            },
            onSpansReceived: (newSpans: Span[]) => {
              if (!newSpans?.length) return
              spans.value.push(...newSpans)
            },
            onLogsReceived(newLogs) {
              if (!newLogs?.length) return
              logs.value.push(...newLogs)
            },
          })
          rpc.value = clientRpc
          isConnected.value = true
        } catch (e) {
          console.warn('[nuxt-otel] Failed to extend client RPC:', e)
          return
        }

        // Clear and reload data on reconnection to ensure consistency
        traces.value = []
        spans.value = []
        logs.value = []

        // Use individual try/catch for each call to prevent partial failure
        Promise.allSettled([
          clientRpc!.getTraces().catch(() => []),
          clientRpc!.getSpans().catch(() => []),
          clientRpc!.getLogs().catch(() => []),
        ])
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
      return spans.value.filter((s) => s.trace_id === traceId)
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
