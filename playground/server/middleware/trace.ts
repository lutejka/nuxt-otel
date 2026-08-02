import { defineEventHandler, getRequestURL, getRequestHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  const { trace } = useOtelTracer('http')

  await trace('request', async (span) => {
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
