import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const { trace } = useOtelTracer('endpoint')
  const logger = useOtelLogger()

  const storage = useStorage()
  const count = (await storage.getItem<number>('nuxt-otel:counter')) ?? 0
  await new Promise((resolve) => {
    const wait = Math.random() * 1000
    for (let i = 0; i <= 24; i++) {
      logger.emit({ severityNumber: i, body: `${i} Wait was ${wait}`, attributes: { wait } })
    }
    setTimeout(() => resolve(true), wait)
  })

  const a = await trace('test', async () => {
    await new Promise((resolve) => {
      const wait = Math.random() * 100
      setTimeout(() => resolve(true), wait)
    })
    return 1
  })
  const value = count + a
  await storage.setItem('nuxt-otel:counter', value)
  return { value }
})
