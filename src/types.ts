import type { Trace, Log, Span } from './runtime/otel/parse/parser'

declare module '#nuxt-otel-config' {
  export const nuxtOtel: {
    nuxt?: boolean
    h3?: boolean
    srvx?: boolean
    unstorage?: boolean
  }
  export const devtoolsEnabled: boolean

  export const devServerUrl: string | undefined
}

export interface OtelClientFunctions {
  onTracesReceived: (traces: Trace[]) => void
  onSpansReceived: (spans: Span[]) => void
  onLogsReceived: (logs: Log[]) => void
}

export interface OtelServerFunctions {
  getTraces: () => Trace[]
  getSpans: (traceId?: string) => Span[]
  clearTraces: () => void

  getLogs: () => Log[]

  clearLogs: () => void
}

export const RPC_NAMESPACE = 'nuxt-otel'
