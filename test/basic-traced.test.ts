import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

type Spans = {
  name: string
  attributes: Record<string, unknown>
  status: { code: number }
  kind: number
}[]

type Logs = {
  body: unknown
  severityNumber: number | undefined
  severityText: string | undefined
  attributes: Record<string, unknown>
  eventName: string | undefined
}[]

describe('ssr with tracing enabled', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic-traced', import.meta.url)),
  })

  it('renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<div>basic-traced</div>')
  })

  it('collects h3 and nuxt render spans', async () => {
    await $fetch('/')

    const { spans } = (await $fetch('/api/spans')) as { spans: Spans }
    const spanNames = spans.map((s: { name: string }) => s.name)

    expect(spanNames).toContain('nuxt.render')
    expect(spans.find((s: { name: string }) => s.name === 'nuxt.render')!.attributes).toHaveProperty('url')
    /*
    This will start working with nuxt 5. Until then only nuxt.* and useOtelTracer will show up in the spans
    expect(spanNames).toContain('GET /**')
    expect(spans.find((s: { name: string }) => s.name === 'GET /')?.attributes).toHaveProperty(
      'http.request.method',
      'GET',
    )
    */
  })

  it('creates spans via useOtelTracer', async () => {
    const { result } = await $fetch<{ result: string }>('/api/otel-tracer')
    expect(result).toBe('traced!')

    const { spans } = (await $fetch('/api/spans')) as { spans: Spans }
    const spanNames = spans.map((s: { name: string }) => s.name)

    expect(spanNames).toContain('test.my-span')
  })

  it('creates logs via useOtelLogger', async () => {
    await $fetch('/api/otel-logger')

    const { logs } = (await $fetch('/api/logs')) as { logs: Logs }

    expect(logs.length).toBeGreaterThan(0)
    const log = logs.find((l: { body: unknown }) => l.body === 'hello from otel logger')
    expect(log).toBeDefined()
    expect(log!.severityNumber).toBe(9)
    expect(log!.attributes).toHaveProperty('key', 'value')
  })
})
