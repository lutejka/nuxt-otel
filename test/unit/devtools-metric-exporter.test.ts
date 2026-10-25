import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import type { IncomingMessage } from 'node:http'
import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DevToolsOTLPMetricExporter } from '../../src/runtime/otel/exporters/DevToolsOTLPMetricExporter'

interface ExportedMetric {
  name: string
  unit?: string
  histogram?: {
    dataPoints: {
      count: number | string
      sum: number | string
      min?: number | string
      max?: number | string
    }[]
  }
}

interface ExportedBody {
  resourceMetrics: {
    scopeMetrics: {
      scope: { name: string }
      metrics: ExportedMetric[]
    }[]
  }[]
}

const requests: { url: string | undefined; body: ExportedBody }[] = []
const server = createServer((req: IncomingMessage, res) => {
  let raw = ''
  req.setEncoding('utf8')
  req.on('data', chunk => (raw += chunk))
  req.on('end', () => {
    requests.push({ url: req.url, body: JSON.parse(raw) as ExportedBody })
    res.statusCode = 200
    res.end('{}')
  })
})

let provider: MeterProvider | undefined
let devServerUrl: string | undefined

beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('Expected a TCP address')
  }
  devServerUrl = `http://127.0.0.1:${address.port}`
  globalThis.devServerUrl = devServerUrl
})

afterAll(async () => {
  globalThis.devServerUrl = undefined
  await provider?.shutdown()
  await new Promise<void>(resolve => server.close(() => resolve()))
})

describe('DevToolsOTLPMetricExporter', () => {
  it('posts JSON OTLP metrics to the devtools ingest endpoint', async () => {
    provider = new MeterProvider({
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new DevToolsOTLPMetricExporter(),
          exportIntervalMillis: 100,
        }),
      ],
    })

    const quantity = provider.getMeter('order').createHistogram('orders.quantity', {
      description: 'Quantity of items in completed orders',
      unit: '{item}',
    })
    quantity.record(2)
    quantity.record(4)

    await waitFor(() => requests.length > 0)

    expect(requests[0]!.url).toBe('/__opentelemetry-ingest')
    const metric = requests[0]!.body.resourceMetrics[0]!.scopeMetrics[0]!.metrics.find(m =>
      m.name === 'orders.quantity'
    )
    expect(metric).toBeDefined()
    expect(metric!.unit).toBe('{item}')

    const dataPoint = metric!.histogram!.dataPoints[0]!
    const count = Number(dataPoint.count)
    const sum = Number(dataPoint.sum)
    expect(count).toBe(2)
    expect(sum).toBe(6)
    // The devtools panel renders histograms as sum / count.
    expect(sum / count).toBe(3)
  })
})

async function waitFor(predicate: () => boolean, timeoutMillis = 5_000) {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMillis) {
      throw new Error('Timed out waiting for the metric export')
    }
    await new Promise(resolve => setTimeout(resolve, 25))
  }
}
