import type { Tracer } from '@opentelemetry/api'
import { traceChannel, setAttr } from './traceChannel'

interface UnstorageMessage {
  keys: string[]
  meta?: boolean
  base?: string
  driver?: {
    name: string
    options: Record<string, unknown>
  }
}

export function registerUnstorageChannels(tracer: Tracer) {
  for (const name of [
    'unstorage.getItem',
    'unstorage.getMeta',
    'unstorage.setItem',
    'unstorage.removeItem',
    'unstorage.getKeys',
    'unstorage.clear',
    'unstorage.hasItem',
    'unstorage.setItems',
    'unstorage.getItems',
    'unstorage.getItemRaw',
    'unstorage.setItemRaw',
  ]) {
    traceChannel<UnstorageMessage>(name, tracer, {
      startUpdate(span, data) {
        const operation = name.slice('unstorage.'.length)
        setAttr(span, 'db.operation', operation)
        setAttr(span, 'db.system', data?.driver?.name)
        setAttr(span, 'unstorage.keys_count', data?.keys?.length)
        if (data.base) {
          setAttr(span, 'unstorage.base', data.base)
        }
        // Use the operation name (with optional base) as the span name, matching nitro's approach
        span.updateName(data.base ? `${operation} ${data.base}` : operation)
      },
    })
  }
}
