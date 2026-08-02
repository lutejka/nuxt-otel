/**
 * MCP (Model Context Protocol) server for nuxt-otel.
 *
 * Exposes OTEL traces, spans, and logs via MCP tools under `/__nuxt-otel-mcp`.
 * Uses the non-deprecated `McpServer` API with `StreamableHTTPServerTransport`
 * in stateless mode.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { H3Event } from 'h3'
import { readRawBody } from 'h3'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { register as registerGetTraces } from './tools/get-traces'
import { register as registerGetSpans } from './tools/get-spans'
import { register as registerGetLogs } from './tools/get-logs'
import { register as registerGetTrace } from './tools/get-trace'

/* ── MCP server factory ──────────────────────────────────────────── */

function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'nuxt-otel-mcp',
      version: '1.0.0',
      title: 'Nuxt OTEL MCP',
      description: 'MCP server exposing OpenTelemetry traces, spans, and logs collected by the nuxt-otel module',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  registerGetTraces(server)
  registerGetSpans(server)
  registerGetLogs(server)
  registerGetTrace(server)

  return server
}

/* ── H3 event handler ────────────────────────────────────────────── */

/**
 * H3 event handler for MCP over Streamable HTTP.
 *
 * Handles POST requests containing JSON-RPC messages for the MCP protocol.
 * GET and DELETE requests are rejected with 405.
 */
export async function mcpHandler(event: H3Event): Promise<void> {
  const method = event.method

  // Only POST is supported in stateless mode
  if (method !== 'POST') {
    const res = event.node.res as ServerResponse
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed. Use POST.' },
        id: null,
      }),
    )
    return
  }

  const req = event.node.req as IncomingMessage
  const res = event.node.res as ServerResponse

  // Read the request body
  let body: unknown
  try {
    const raw = await readRawBody(event, 'utf-8')
    body = raw ? JSON.parse(raw) : undefined
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error: invalid JSON' },
        id: null,
      }),
    )
    return
  }

  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  })

  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  } catch (error) {
    console.error('[nuxt-otel-mcp] Error handling MCP request:', error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        }),
      )
    }
  } finally {
    await transport.close().catch(() => {})
    await server.close().catch(() => {})
  }
}
