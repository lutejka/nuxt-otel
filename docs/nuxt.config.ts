export default defineNuxtConfig({
  site: {
    url: 'https://nuxt-otel.vercel.app',
  },
  image: {
    // Docs are deployed as a static site under a base URL (GitHub Pages).
    // Image optimization (IPX) breaks there, so serve images as-is.
    provider: 'none',
  },
})
