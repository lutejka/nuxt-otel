import { defineEventHandler, getRequestHeaders, getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const { trace } = useOtelTracer('app')

  await trace('middleware', async (span) => {
    const url = getRequestURL(event)
    const headers = getRequestHeaders(event)

    span.setAttributes({
      'http.method': event.method,
      'http.path': url.pathname,
      'http.host': url.host,
      'http.user_agent': headers['user-agent'] || 'unknown',
    })
  })
})
