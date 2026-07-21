import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { registerTool } from './utils'

export function register(server: McpServer): void {
  registerTool(server, {
    name: 'get_logs',
    description: 'Retrieve all collected OpenTelemetry logs',
    inputSchema: {
      limit: z.number().int().min(1).optional().describe('Maximum number of logs to return'),
    },
    handler: async ({ limit }) => {
      const logs = globalThis.__nuxtOTelLogs ?? []
      const result = limit ? logs.slice(0, limit as number) : logs
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }
    },
  })
}
