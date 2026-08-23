import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTool } from './utils'

export function register(server: McpServer): void {
  registerTool(server, {
    name: 'get_spans',
    description: 'Retrieve collected OpenTelemetry spans, optionally filtered by trace ID',
    inputSchema: {
      trace_id: z.string().optional().describe('Optional trace ID to filter spans by'),
      limit: z.number().int().min(1).optional().describe('Maximum number of spans to return'),
    },
    handler: async ({ trace_id, limit }) => {
      const allSpans = globalThis.__nuxtOtelSpans ?? []
      const traceId = trace_id as string | undefined
      const max = limit as number | undefined
      let spans = traceId ? allSpans.filter(s => s.trace_id === traceId) : allSpans
      if (max) spans = spans.slice(0, max)
      return {
        content: [{ type: 'text', text: JSON.stringify(spans) }],
      }
    },
  })
}
