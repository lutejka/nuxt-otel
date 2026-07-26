import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTool } from './utils'

export function register(server: McpServer): void {
  registerTool(server, {
    name: 'get_trace',
    description: 'Retrieve a single trace and its spans by trace ID',
    inputSchema: {
      trace_id: z.string().describe('The trace ID to look up'),
    },
    handler: async ({ trace_id }) => {
      const traceId = trace_id as string
      const traces = globalThis.__nuxtOtelTraces ?? []
      const spans = globalThis.__nuxtOtelSpans ?? []
      const trace = traces.find(t => t.trace_id === traceId) ?? null
      const traceSpans = spans.filter(s => s.trace_id === traceId)
      return {
        content: [{ type: 'text', text: JSON.stringify({ trace, spans: traceSpans }) }],
      }
    },
  })
}
