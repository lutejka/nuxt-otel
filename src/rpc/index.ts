import { useLogger } from '@nuxt/kit'
import { extendServerRpc } from '@nuxt/devtools-kit'
import type { Nuxt } from '@nuxt/schema'
import type { OtelClientFunctions, OtelServerFunctions } from '../runtime/core/rpc-types'
import { setupTraceRPC } from './traces'

export function setupRPC(nuxt: Nuxt) {
  const logger = useLogger('nuxt-otel')
  const serverFunctions = {} as OtelServerFunctions

  setupTraceRPC(serverFunctions)

  nuxt.hook('modules:done', () => {
    if (!nuxt.options.dev) return

    try {
      const rpcGroup = extendServerRpc<OtelClientFunctions, OtelServerFunctions>('nuxt-otel', serverFunctions, nuxt)

      globalThis.__nuxtOtelRpcBroadcast = {
        onTraceReceived: (trace) => {
          rpcGroup.broadcast.onTraceReceived(trace)
        },
        onSpanReceived: (span) => {
          rpcGroup.broadcast.onSpanReceived(span)
        },
        onLogReceived: (log) => {
          rpcGroup.broadcast.onLogReceived(log)
        },
      }
    }
    catch (e) {
      logger.warn('Failed to setup devtools RPC:', e)
    }
  })
}
