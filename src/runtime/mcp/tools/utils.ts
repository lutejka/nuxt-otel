import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import type { z } from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * A tool definition with a Zod raw-shape input schema.
 */
export interface ToolDef {
  name: string
  description: string
  inputSchema?: Record<string, z.ZodTypeAny>
  handler: (args: Record<string, unknown>) => CallToolResult | Promise<CallToolResult>
}

/**
 * Register a tool on an McpServer with minimal ceremony.
 *
 * The type casts are necessary because `McpServer.registerTool` has complex
 * generic overloads that are hard to satisfy dynamically, but the runtime
 * behaviour is exactly what we need.
 */
export function registerTool(server: McpServer, def: ToolDef): void {
  server.registerTool(
    def.name as string,
    {
      description: def.description,
      inputSchema: def.inputSchema as Record<string, never> | undefined,
    },
    def.handler as (args: Record<string, never>) => ReturnType<typeof def.handler>,
  )
}
