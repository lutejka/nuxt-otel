import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTool } from './utils'

export function register(server: McpServer): void {
  registerTool(server, {
    name: 'get_traces',
    description: 'Retrieve all collected OpenTelemetry traces',
    inputSchema: {
      limit: z.number().int().min(1).optional().describe('Maximum number of traces to return'),
    },
    handler: async ({ limit }) => {
      const traces = globalThis.__nuxtOtelTraces ?? []
      const result = limit ? traces.slice(0, limit as number) : traces
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }
    },
  })
}
