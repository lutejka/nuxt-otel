import { defineEventHandler } from 'h3'
import { useOtelTracer } from '../../../../../src/runtime/server/composables/useOtelTracer'

export default defineEventHandler(async () => {
  const { trace } = useOtelTracer('test')
  const result = await trace('my-span', async () => {
    return 'traced!'
  })
  return { result }
})
