export default defineNuxtConfig({
  site: {
    name: 'Nuxt OTel',
    description: 'OpenTelemetry tracing for Nuxt applications using Diagnostic Channels.',
    url: 'https://nuxt-otel.vercel.app',
  },
  image: {
    // Docs are deployed as a static site under a base URL (GitHub Pages).
    // Image optimization (IPX) breaks there, so serve images as-is.
    provider: 'none',
  },
})
