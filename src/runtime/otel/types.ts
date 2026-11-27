import type { IncomingMessage } from 'node:http'

/**
 * Map HTTP headers to span attributes.
 * - `client.requestHeaders` / `client.responseHeaders`: headers to copy from
 *   outgoing requests to span attributes.
 * - `server.requestHeaders` / `server.responseHeaders`: headers to copy from
 *   incoming requests to span attributes.
 */
export interface HeadersToSpanAttributes {
  client?: {
    requestHeaders?: string[]
    responseHeaders?: string[]
  }
  server?: {
    requestHeaders?: string[]
    responseHeaders?: string[]
  }
}

/**
 * Check whether an incoming request should be excluded from tracing.
 * Receives the raw `IncomingMessage` and returns `true` to skip it.
 */
export type IgnoreRequestHook = (request: IncomingMessage) => boolean

export interface ModuleOptions {
  instrument: boolean
  devtools?: boolean

  /**
   * Map HTTP headers to span attributes.
   * Passed to both `@opentelemetry/instrumentation-http` and
   * `@opentelemetry/instrumentation-undici`.
   */
  headersToSpanAttributes?: HeadersToSpanAttributes

  /**
   * Query parameters to redact on incoming (server) spans.
   * When omitted, defaults to a built-in list of known sensitive parameter
   * names. Set to an empty array to disable server-side query parameter
   * redaction entirely.
   */
  redactedQueryParamsServer?: string[]

  /**
   * Query parameters to redact on outgoing (client) spans.
   * When omitted, defaults to a built-in list of known sensitive parameter
   * names. Set to an empty array to disable client-side query parameter
   * redaction entirely.
   */
  redactedQueryParams?: string[]

  /**
   * URL path patterns to exclude from tracing. Matches are performed against
   * the request pathname (query and hash stripped). Supports both strings
   * (prefix match) and regular expressions.
   *
   * When provided, these paths are wired to
   * `ignoreIncomingRequestHook`, `ignoreOutgoingRequestHook`, and
   * `ignoreRequestHook` on the HTTP and undici instrumentations.
   *
   * @example
   * ```ts
   * nuxtOtel: {
   *   ignoreRequestPaths: ['/health', '/metrics', /^\/__internal/]
   * }
   * ```
   */
  ignoreRequestPaths?: (string | RegExp)[]

  /**
   * Custom hook to exclude requests from tracing. When provided, it is wired
   * to `ignoreIncomingRequestHook`, `ignoreOutgoingRequestHook`, and
   * `ignoreRequestHook` on the HTTP and undici instrumentations.
   * @deprecated Use `ignoreRequestPaths` instead for path-based filtering.
   */
  ignoreRequest?: IgnoreRequestHook
}
