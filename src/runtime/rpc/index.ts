import { useLogger } from '@nuxt/kit'
import { extendServerRpc } from '@nuxt/devtools-kit'
import type { Nuxt } from '@nuxt/schema'
import { setupTraceRPC } from './traces'
import type { OtelClientFunctions, OtelServerFunctions } from '~/src/types'

export function setupRPC(nuxt: Nuxt) {
  const logger = useLogger('nuxt-otel')
  const serverFunctions = {} as OtelServerFunctions

  setupTraceRPC(serverFunctions)

  nuxt.hook('modules:done', () => {
    if (!nuxt.options.dev) return

    try {
      const rpcGroup = extendServerRpc<OtelClientFunctions, OtelServerFunctions>('nuxt-otel', serverFunctions, nuxt)

      globalThis.__nuxtOtelRpcBroadcast = {
        onTracesReceived: (traces) => {
          rpcGroup.broadcast.onTracesReceived(traces)
        },
        onSpansReceived: (spans) => {
          rpcGroup.broadcast.onSpansReceived(spans)
        },
        onLogsReceived: (logs) => {
          rpcGroup.broadcast.onLogsReceived(logs)
        },
      }
    } catch (e) {
      logger.warn('Failed to setup devtools RPC:', e)
    }
  })
}
